/**
 * Страница сообщений специалиста
 * Чат с клиентами
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Search,
  Send,
  Check,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSpecialistAuth } from '@/contexts/SpecialistAuthContext';
import {
  Message,
  Conversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
} from '@/lib/supabase-messages';

export default function SpecialistMessages() {
  const { toast } = useToast();
  const { specialistUser } = useSpecialistAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка бесед
  useEffect(() => {
    if (specialistUser?.id) {
      loadConversations();
    }
  }, [specialistUser?.id]);

  // Подписка на новые сообщения
  useEffect(() => {
    if (!specialistUser?.id) return;

    const unsubscribe = subscribeToMessages((newMsg) => {
      // Обновляем сообщения если это текущая беседа
      if (selectedConversation &&
          (newMsg.sender_id === selectedConversation.recipientId ||
           newMsg.recipient_id === selectedConversation.recipientId)) {
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();

        // Помечаем как прочитанное если мы получатель
        if (newMsg.recipient_id === specialistUser.id) {
          markMessagesAsRead(newMsg.sender_id);
        }
      }

      // Обновляем список бесед
      loadConversations();
    });

    return () => unsubscribe();
  }, [specialistUser?.id, selectedConversation?.recipientId]);

  // Скролл к последнему сообщению
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const convs = await getConversations();
      setConversations(convs);
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

  const loadMessages = async (recipientId: string) => {
    try {
      setIsLoadingMessages(true);
      const msgs = await getMessages(recipientId);
      setMessages(msgs);

      // Помечаем как прочитанные
      await markMessagesAsRead(recipientId);

      // Обновляем счётчик в списке бесед
      setConversations(prev =>
        prev.map(conv =>
          conv.recipientId === recipientId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.recipientId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      const sent = await sendMessage(selectedConversation.recipientId, newMessage);
      setMessages(prev => [...prev, sent]);
      setNewMessage('');
      scrollToBottom();

      // Обновляем последнее сообщение в беседе
      setConversations(prev =>
        prev.map(conv =>
          conv.recipientId === selectedConversation.recipientId
            ? { ...conv, lastMessage: sent }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
    }
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
    conv.recipientName.toLowerCase().includes(searchQuery.toLowerCase())
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
                      key={conv.recipientId}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedConversation?.recipientId === conv.recipientId
                          ? 'bg-primary/10'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {conv.recipientAvatar ? (
                          <img
                            src={conv.recipientAvatar}
                            alt={conv.recipientName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {getInitials(conv.recipientName)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{conv.recipientName}</p>
                            {conv.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(conv.lastMessage.created_at)}
                              </span>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage.sender_id === specialistUser?.id ? 'Вы: ' : ''}
                              {conv.lastMessage.content}
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
                  {selectedConversation.recipientAvatar ? (
                    <img
                      src={selectedConversation.recipientAvatar}
                      alt={selectedConversation.recipientName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {getInitials(selectedConversation.recipientName)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{selectedConversation.recipientName}</p>
                    <p className="text-sm text-muted-foreground">Клиент</p>
                  </div>
                </div>

                {/* Сообщения */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Нет сообщений</p>
                      <p className="text-sm mt-1">Начните беседу с клиентом</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.sender_id === specialistUser?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {formatTime(message.created_at)}
                                </span>
                                {isOwn && (
                                  message.is_read ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
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
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={isSending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
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
