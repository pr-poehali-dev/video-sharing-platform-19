-- Обновление паролей для тестовых пользователей (SHA256 hash от "test123")
UPDATE users 
SET password_hash = 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae'
WHERE email IN ('creative@example.com', 'dance@example.com', 'tech@example.com');
