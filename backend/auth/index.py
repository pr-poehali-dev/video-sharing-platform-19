import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import secrets
from datetime import datetime, timedelta

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def handler(event: dict, context) -> dict:
    """API авторизации: регистрация, вход, выход, проверка токена"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                username = body.get('username', '').strip()
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                
                if not username or not email or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Все поля обязательны'}),
                        'isBase64Encoded': False
                    }
                
                if len(password) < 6:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пароль должен быть минимум 6 символов'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
                if cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь с таким email или username уже существует'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}"
                
                cur.execute("""
                    INSERT INTO users (username, email, password_hash, avatar_url, is_verified)
                    VALUES (%s, %s, %s, %s, true)
                    RETURNING id, username, email, avatar_url
                """, (username, email, password_hash, avatar_url))
                
                user = cur.fetchone()
                conn.commit()
                
                token = generate_token()
                expires_at = datetime.now() + timedelta(days=30)
                
                cur.execute("""
                    INSERT INTO sessions (user_id, token, expires_at)
                    VALUES (%s, %s, %s)
                """, (user['id'], token, expires_at))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'token': token,
                        'user': {
                            'id': user['id'],
                            'username': user['username'],
                            'email': user['email'],
                            'avatar': user['avatar_url']
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                
                if not email or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email и пароль обязательны'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                
                cur.execute("""
                    SELECT id, username, email, avatar_url, bio, followers_count, following_count
                    FROM users
                    WHERE email = %s AND password_hash = %s
                """, (email, password_hash))
                
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный email или пароль'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user['id'],))
                conn.commit()
                
                token = generate_token()
                expires_at = datetime.now() + timedelta(days=30)
                
                cur.execute("""
                    INSERT INTO sessions (user_id, token, expires_at)
                    VALUES (%s, %s, %s)
                """, (user['id'], token, expires_at))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'token': token,
                        'user': {
                            'id': user['id'],
                            'username': user['username'],
                            'email': user['email'],
                            'avatar': user['avatar_url'],
                            'bio': user['bio'],
                            'followersCount': user['followers_count'],
                            'followingCount': user['following_count']
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'logout':
                token = body.get('token')
                
                if token:
                    cur.execute("DELETE FROM sessions WHERE token = %s", (token,))
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            token = event.get('queryStringParameters', {}).get('token')
            
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен не предоставлен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT u.id, u.username, u.email, u.avatar_url, u.bio, 
                       u.followers_count, u.following_count, s.expires_at
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = %s AND s.expires_at > NOW()
            """, (token,))
            
            result = cur.fetchone()
            
            if not result:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен недействителен или истёк'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': result['id'],
                        'username': result['username'],
                        'email': result['email'],
                        'avatar': result['avatar_url'],
                        'bio': result['bio'],
                        'followersCount': result['followers_count'],
                        'followingCount': result['following_count']
                    }
                }),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
