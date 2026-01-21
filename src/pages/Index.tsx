import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const API_URL = 'https://functions.poehali.dev/13f3dab4-dcb1-486f-9c81-adb72a594f09';

export default function Index() {
  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
    fetchTrending();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${API_URL}?action=feed`);
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch(`${API_URL}?action=trending`);
      const data = await response.json();
      setTrendingHashtags(data.hashtags || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const handleLike = async (videoId: number) => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          userId: 1,
          videoId
        })
      });
      fetchVideos();
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 border-r border-border flex flex-col fixed h-full bg-black z-50">
        <div className="p-4 lg:p-6">
          <h1 className="text-2xl lg:text-3xl font-bold gradient-text hidden lg:block">VibeClip</h1>
          <div className="lg:hidden gradient-text text-2xl font-bold">V</div>
        </div>

        <nav className="flex-1 px-2 lg:px-4 space-y-2">
          {[
            { id: 'home', icon: 'Home', label: 'Главная' },
            { id: 'explore', icon: 'Compass', label: 'Explore' },
            { id: 'search', icon: 'Search', label: 'Поиск' },
            { id: 'trends', icon: 'TrendingUp', label: 'Тренды' },
            { id: 'messages', icon: 'MessageCircle', label: 'Сообщения' },
            { id: 'notifications', icon: 'Bell', label: 'Уведомления' },
            { id: 'profile', icon: 'User', label: 'Профиль' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-4 px-3 lg:px-4 py-3 rounded-xl transition-all duration-300 ${
                activeSection === item.id
                  ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/50'
                  : 'hover:bg-muted/50'
              }`}
            >
              <Icon name={item.icon as any} size={24} className={activeSection === item.id ? 'text-primary' : ''} />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 lg:p-4">
          <Button className="w-full gradient-primary hover:opacity-90 transition-opacity font-bold text-base py-6 rounded-full">
            <Icon name="Plus" size={20} className="lg:mr-2" />
            <span className="hidden lg:inline">Загрузить</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 bg-black/80 backdrop-blur-lg border-b border-border z-40 px-4 lg:px-8 py-4">
          <div className="flex items-center gap-4 max-w-2xl">
            <div className="flex-1 relative">
              <Icon name="Search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск видео, хештегов, пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border rounded-full"
              />
            </div>
          </div>
        </header>

        {/* Video Feed */}
        <div className="flex">
          {/* Videos Column */}
          <div className="flex-1 max-w-2xl mx-auto">
            <div className="h-[calc(100vh-5rem)] overflow-y-auto">
              <div className="space-y-4 p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Загрузка видео...</p>
                    </div>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Icon name="Video" size={48} className="mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Нет видео для показа</p>
                    </div>
                  </div>
                ) : videos.map((video: any) => (
                  <div key={video.id} className="relative group">
                    {/* Video Container */}
                    <div 
                      className="aspect-916 rounded-3xl overflow-hidden video-shadow relative"
                      style={{ background: video.thumbnail }}
                    >
                      {/* Video Overlay UI */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                      
                      {/* Play Button (Center) */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform">
                          <Icon name="Play" size={32} className="text-white ml-1" />
                        </button>
                      </div>

                      {/* Bottom Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-white">
                            <AvatarImage src={video.avatar} />
                            <AvatarFallback>{video.username[1]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-bold text-white">{video.username}</p>
                            <p className="text-sm text-white/80 flex items-center gap-2">
                              <Icon name="Music" size={14} />
                              {video.music}
                            </p>
                          </div>
                          <Button size="sm" className="rounded-full gradient-primary font-bold">
                            Подписаться
                          </Button>
                        </div>
                        <p className="text-white text-sm leading-relaxed">{video.description}</p>
                      </div>

                      {/* Right Side Actions */}
                      <div className="absolute right-4 bottom-20 space-y-6">
                        <button 
                          onClick={() => handleLike(video.id)}
                          className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
                        >
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-primary/30">
                            <Icon name="Heart" size={24} className="text-white" />
                          </div>
                          <span className="text-xs font-bold text-white">{video.likes}</span>
                        </button>

                        <button className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <Icon name="MessageCircle" size={24} className="text-white" />
                          </div>
                          <span className="text-xs font-bold text-white">{video.comments}</span>
                        </button>

                        <button className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <Icon name="Send" size={24} className="text-white" />
                          </div>
                          <span className="text-xs font-bold text-white">{video.shares}</span>
                        </button>

                        <button className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <Icon name="Bookmark" size={24} className="text-white" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Trends */}
          <aside className="hidden xl:block w-80 border-l border-border p-6 h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 gradient-text">🔥 Тренды</h2>
                <div className="space-y-3">
                  {trendingHashtags.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <p className="font-bold text-lg group-hover:gradient-text transition-all">{item.tag}</p>
                      <p className="text-sm text-muted-foreground">{item.views} просмотров</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">⚡ Популярные категории</h2>
                <div className="flex flex-wrap gap-2">
                  {['Танцы', 'Комедия', 'Обучение', 'Спорт', 'Кулинария', 'DIY', 'Музыка', 'Путешествия'].map((cat) => (
                    <Badge key={cat} variant="secondary" className="px-4 py-2 text-sm cursor-pointer hover:gradient-primary hover:text-white transition-all">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30">
                <Icon name="Sparkles" size={24} className="text-primary mb-2" />
                <h3 className="font-bold mb-2">Стань звездой!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Загрузи своё первое видео и получи 100 бонусных лайков
                </p>
                <Button className="w-full gradient-secondary font-bold">
                  Начать
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}