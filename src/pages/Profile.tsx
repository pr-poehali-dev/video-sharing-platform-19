import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const AUTH_API = 'https://functions.poehali.dev/90a85ded-1927-4b37-9335-5f736b7cfd8c';
const VIDEOS_API = 'https://functions.poehali.dev/13f3dab4-dcb1-486f-9c81-adb72a594f09';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [myVideos, setMyVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${AUTH_API}?token=${token}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');
    
    try {
      await fetch(AUTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', token })
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    toast({
      title: '👋 До встречи!',
      description: 'Вы успешно вышли из аккаунта'
    });

    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 bg-black/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-muted"
          >
            <Icon name="ArrowLeft" size={24} />
          </Button>
          <h1 className="text-xl font-bold">Профиль</h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            className="hover:bg-destructive/20 hover:text-destructive"
          >
            <Icon name="LogOut" size={24} />
          </Button>
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Avatar className="w-32 h-32 mb-4 border-4 border-primary">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-4xl">{user.username[0]}</AvatarFallback>
          </Avatar>
          
          <h2 className="text-3xl font-bold gradient-text mb-2">{user.username}</h2>
          <p className="text-muted-foreground mb-4">{user.email}</p>
          
          {user.bio && (
            <p className="text-sm max-w-md mb-6">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex gap-8 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">{user.followersCount || 0}</div>
              <div className="text-sm text-muted-foreground">Подписчиков</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">{user.followingCount || 0}</div>
              <div className="text-sm text-muted-foreground">Подписок</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">{myVideos.length}</div>
              <div className="text-sm text-muted-foreground">Видео</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="gradient-primary font-bold">
              <Icon name="Edit" size={18} className="mr-2" />
              Редактировать профиль
            </Button>
            <Button variant="outline" className="font-bold">
              <Icon name="Settings" size={18} className="mr-2" />
              Настройки
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3 mb-8">
            <TabsTrigger value="videos" className="gap-2">
              <Icon name="Video" size={18} />
              Видео
            </TabsTrigger>
            <TabsTrigger value="liked" className="gap-2">
              <Icon name="Heart" size={18} />
              Лайки
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Icon name="Bookmark" size={18} />
              Сохранённое
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            {myVideos.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="Video" size={64} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Пока нет видео</h3>
                <p className="text-muted-foreground mb-6">Загрузите своё первое видео!</p>
                <Button className="gradient-primary font-bold">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Создать видео
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {myVideos.map((video) => (
                  <div key={video.id} className="aspect-916 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked">
            <div className="text-center py-16">
              <Icon name="Heart" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Понравившиеся видео</h3>
              <p className="text-muted-foreground">Здесь будут видео, которые вам понравились</p>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="text-center py-16">
              <Icon name="Bookmark" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Сохранённые видео</h3>
              <p className="text-muted-foreground">Здесь будут сохранённые вами видео</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border bg-gradient-to-br from-primary/10 to-secondary/10 cursor-pointer hover:scale-105 transition-transform">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon name="TrendingUp" size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Статистика</h3>
                <p className="text-sm text-muted-foreground">Смотрите аналитику ваших видео</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-gradient-to-br from-accent/10 to-primary/10 cursor-pointer hover:scale-105 transition-transform">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Icon name="Users" size={24} className="text-accent" />
              </div>
              <div>
                <h3 className="font-bold mb-1">Аудитория</h3>
                <p className="text-sm text-muted-foreground">Узнайте больше о подписчиках</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
