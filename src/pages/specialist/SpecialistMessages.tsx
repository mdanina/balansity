/**
 * Страница сообщений специалиста
 * Чат с клиентами
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Search,
  User,
  Send,
  Clock,
  Check,
  CheckCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';

interface ClientConversation {
  id: string;
  clientUserId: string;
  clientName: string;
  clientAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'specialist' | 'client';
  created_at: string;
  is_read: boolean;
}

export default function SpecialistMessages() {
  const { toast } = useToast();
  const { specialistUser } = useSpecialistAuth();

  const [conversations, setConversations] = useState<ClientConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ClientConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (specialistUser?.specialist?.id) {
      loadConversations();
    }
  }, [specialistUser?.specialist?.id]);

  const loadConversations = async () => {
    if (!specialistUser?.specialist?.id) return;

    try {
      setIsLoading(true);

      // Получаем всех клиентов специалиста
      const { data: assignments, error } = await supabase
        .from('client_assignments')
        .select('client_user_id')
        .eq('specialist_id', specialistUser.specialist.id)
        .eq('status', 'active');

      if (error) throw error;

      if (!assignments || assignments.length === 0) {
        setConversations([]);
        return;
      }

      const clientIds = assignments.map(a => a.client_user_id);

      // Получаем данные о клиентах
      const { data: clients } = await supabase
        .from('users')
        .select('id, email')
        .in('id', clientIds);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', clientIds);

      const conversationsList: ClientConversation[] = (clients || []).map(client => {
        const profile = profiles?.find(p => p.user_id === client.id);
        const name = profile
          ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
          : client.email || 'Клиент';

        return {
          id: client.id,
          clientUserId: client.id,
          clientName: name,
          clientAvatar: profile?.avatar_url || null,
          lastMessage: null, // Будет загружаться отдельно когда будет таблица messages
          lastMessageAt: null,
          unreadCount: 0,
        };
      });

      setConversations(conversationsList);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить беседы',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (clientUserId: string) => {
    setIsLoadingMessages(true);
    // Сообщения пока не реализованы - нужна таблица messages
    // Здесь будет загрузка сообщений из Supabase
    setMessages([]);
    setIsLoadingMessages(false);
  };

  const handleSelectConversation = (conversation: ClientConversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.clientUserId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Отправка сообщений пока не реализована
    toast({
      title: 'В разработке',
      description: 'Функция сообщений находится в разработке',
    });

    setNewMessage('');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Фильтрация бесед по поиску
  const filteredConversations = conversations.filter((conv) =>
    conv.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-12rem)]">
        <Card className="h-full">
          <div className="flex h-full">
            <div className="w-80 border-r p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      <Card className="h-full">
        <div className="flex h-full">
          {/* Список бесед */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold mb-3">Сообщения</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? 'Ничего не найдено' : 'Нет клиентов для беседы'}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-primary/10'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {conv.clientAvatar ? (
                          <img
                            src={conv.clientAvatar}
                            alt={conv.clientName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {getInitials(conv.clientName)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conv.clientName}</p>
                            {conv.lastMessageAt && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge className="ml-2">{conv.unreadCount}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Область чата */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Заголовок чата */}
                <div className="p-4 border-b flex items-center gap-3">
                  {selectedConversation.clientAvatar ? (
                    <img
                      src={selectedConversation.clientAvatar}
                      alt={selectedConversation.clientName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {getInitials(selectedConversation.clientName)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedConversation.clientName}</p>
                    <p className="text-sm text-muted-foreground">Онлайн</p>
                  </div>
                </div>

                {/* Сообщения */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Загрузка...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Нет сообщений</p>
                      <p className="text-sm mt-1">Начните беседу с клиентом</p>
                      <p className="text-xs mt-4 text-center max-w-sm">
                        Функция обмена сообщениями находится в разработке.
                        Скоро вы сможете общаться с клиентами в реальном времени.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_type === 'specialist'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.sender_type === 'specialist'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs opacity-70">
                                {formatTime(message.created_at)}
                              </span>
                              {message.sender_type === 'specialist' && (
                                message.is_read ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Ввод сообщения */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Введите сообщение..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Выберите беседу</p>
                <p className="text-sm mt-1">Выберите клиента из списка слева</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
