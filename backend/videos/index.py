import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """API для работы с видео: получение ленты, загрузка, лайки, комментарии"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            path = event.get('queryStringParameters', {}).get('action', 'feed')
            
            if path == 'feed':
                cur.execute("""
                    SELECT 
                        v.id,
                        v.video_url,
                        v.thumbnail_url,
                        v.description,
                        v.music_name,
                        v.likes_count,
                        v.comments_count,
                        v.shares_count,
                        v.views_count,
                        v.created_at,
                        u.username,
                        u.avatar_url
                    FROM videos v
                    JOIN users u ON v.user_id = u.id
                    ORDER BY v.created_at DESC
                    LIMIT 20
                """)
                videos = cur.fetchall()
                
                result = []
                for video in videos:
                    result.append({
                        'id': video['id'],
                        'username': video['username'],
                        'avatar': video['avatar_url'],
                        'description': video['description'],
                        'likes': format_count(video['likes_count']),
                        'comments': format_count(video['comments_count']),
                        'shares': format_count(video['shares_count']),
                        'music': video['music_name'] or 'Original Sound',
                        'videoUrl': video['video_url'],
                        'thumbnail': video['thumbnail_url']
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'videos': result}),
                    'isBase64Encoded': False
                }
            
            elif path == 'trending':
                cur.execute("""
                    SELECT tag, views_count
                    FROM hashtags
                    ORDER BY views_count DESC
                    LIMIT 10
                """)
                hashtags = cur.fetchall()
                
                result = [{'tag': h['tag'], 'views': format_count(h['views_count'])} for h in hashtags]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'hashtags': result}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'upload':
                user_id = body.get('userId')
                video_url = body.get('videoUrl')
                description = body.get('description', '')
                music_name = body.get('musicName')
                thumbnail_url = body.get('thumbnailUrl')
                
                cur.execute("""
                    INSERT INTO videos (user_id, video_url, thumbnail_url, description, music_name)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (user_id, video_url, thumbnail_url, description, music_name))
                
                video_id = cur.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'videoId': video_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'like':
                user_id = body.get('userId')
                video_id = body.get('videoId')
                
                cur.execute("""
                    INSERT INTO likes (user_id, video_id)
                    VALUES (%s, %s)
                    ON CONFLICT (user_id, video_id) DO NOTHING
                """, (user_id, video_id))
                
                cur.execute("""
                    UPDATE videos
                    SET likes_count = (SELECT COUNT(*) FROM likes WHERE video_id = %s)
                    WHERE id = %s
                """, (video_id, video_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'comment':
                user_id = body.get('userId')
                video_id = body.get('videoId')
                text = body.get('text')
                
                cur.execute("""
                    INSERT INTO comments (user_id, video_id, text)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (user_id, video_id, text))
                
                cur.execute("""
                    UPDATE videos
                    SET comments_count = (SELECT COUNT(*) FROM comments WHERE video_id = %s)
                    WHERE id = %s
                """, (video_id, video_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
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

def format_count(count):
    if count >= 1000000:
        return f"{count / 1000000:.1f}M"
    elif count >= 1000:
        return f"{count / 1000:.1f}K"
    return str(count)
