-- Добавление тестовых пользователей
INSERT INTO users (username, email, avatar_url, bio, followers_count)
VALUES 
  ('@creative_soul', 'creative@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', 'Видеомонтажёр и креативщик', 24500),
  ('@dance_master', 'dance@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', 'Профессиональный танцор', 89200),
  ('@tech_wizard', 'tech@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', 'Технологические лайфхаки', 56700);

-- Добавление тестовых видео
INSERT INTO videos (user_id, video_url, thumbnail_url, description, music_name, likes_count, comments_count, shares_count, views_count)
VALUES 
  (1, 'https://cdn.poehali.dev/demo/video1.mp4', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'Удивительный трюк с монтажом! 🎬 #видеомонтаж #креатив', 'Trending Sound #1', 245000, 1200, 856, 520000),
  (2, 'https://cdn.poehali.dev/demo/video2.mp4', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'Новый челлендж 🔥 Повтори если сможешь! #танцы #challenge', 'Dance Vibes Mix', 892000, 3500, 2100, 1500000),
  (3, 'https://cdn.poehali.dev/demo/video3.mp4', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 'Лайфхак дня: как ускорить смартфон 📱 #tech #лайфхак', 'Tech Beats 2024', 567000, 987, 1300, 780000);

-- Добавление трендовых хештегов
INSERT INTO hashtags (tag, views_count)
VALUES 
  ('#Challenge2024', 12500000),
  ('#ВираличныйТанец', 8900000),
  ('#ЛайфхакиДня', 6200000),
  ('#КреативныйМонтаж', 5100000),
  ('#ТанцыТикТок', 4800000),
  ('#ВидеоМонтаж', 3900000);
