/**
 * API для системы сообщений
 * Чат между специалистами и клиентами
 */

import { supabase } from './supabase';
import { logger } from './logger';

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  recipientId: string;
  recipientName: string;
  recipientAvatar: string | null;
  lastMessage: Message | null;
  unreadCount: number;
}

/**
 * Получить список бесед для текущего пользователя
 */
export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем всех собеседников из client_assignments
  // Для специалиста - его клиенты
  // Для клиента - его специалисты

  // Сначала проверяем, является ли пользователь специалистом
  const { data: specialist } = await supabase
    .from('specialists')
    .select('id')
    .eq('user_id', user.id)
    .single();

  let recipientIds: string[] = [];

  if (specialist) {
    // Пользователь - специалист, получаем его клиентов
    const { data: assignments } = await supabase
      .from('client_assignments')
      .select('client_user_id')
      .eq('specialist_id', specialist.id)
      .eq('status', 'active');

    recipientIds = assignments?.map(a => a.client_user_id) || [];
  } else {
    // Пользователь - клиент, получаем его специалистов
    const { data: assignments } = await supabase
      .from('client_assignments')
      .select('specialist:specialists!inner(user_id)')
      .eq('client_user_id', user.id)
      .eq('status', 'active');

    recipientIds = assignments?.map((a: any) => a.specialist.user_id) || [];
  }

  if (recipientIds.length === 0) {
    return [];
  }

  // Получаем данные о получателях
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .in('id', recipientIds);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, avatar_url')
    .in('user_id', recipientIds);

  // Получаем специалистов для display_name
  const { data: specialists } = await supabase
    .from('specialists')
    .select('user_id, display_name, avatar_url')
    .in('user_id', recipientIds);

  // Собираем беседы
  const conversations: Conversation[] = [];

  for (const recipientId of recipientIds) {
    const userData = users?.find(u => u.id === recipientId);
    const profile = profiles?.find(p => p.user_id === recipientId);
    const spec = specialists?.find(s => s.user_id === recipientId);

    // Определяем имя
    let name = 'Пользователь';
    if (spec?.display_name) {
      name = spec.display_name;
    } else if (profile?.first_name) {
      name = profile.first_name + (profile.last_name ? ' ' + profile.last_name : '');
    } else if (userData?.email) {
      name = userData.email;
    }

    // Получаем последнее сообщение
    const { data: lastMessages } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastMessage = lastMessages?.[0] || null;

    // Подсчитываем непрочитанные
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', recipientId)
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    conversations.push({
      recipientId,
      recipientName: name,
      recipientAvatar: spec?.avatar_url || profile?.avatar_url || null,
      lastMessage,
      unreadCount: unreadCount || 0,
    });
  }

  // Сортируем по последнему сообщению
  conversations.sort((a, b) => {
    const aTime = a.lastMessage?.created_at || '1970-01-01';
    const bTime = b.lastMessage?.created_at || '1970-01-01';
    return bTime.localeCompare(aTime);
  });

  return conversations;
}

/**
 * Получить сообщения с конкретным пользователем
 */
export async function getMessages(
  recipientId: string,
  limit: number = 50,
  before?: string
): Promise<Message[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  let query = supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching messages:', error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  // Возвращаем в хронологическом порядке
  return (data || []).reverse();
}

/**
 * Отправить сообщение
 */
export async function sendMessage(recipientId: string, content: string): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  if (!content.trim()) {
    throw new Error('Сообщение не может быть пустым');
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Error sending message:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return data as Message;
}

/**
 * Пометить сообщения как прочитанные
 */
export async function markMessagesAsRead(senderId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  const { error } = await supabase
    .from('messages')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('sender_id', senderId)
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  if (error) {
    logger.error('Error marking messages as read:', error);
  }
}

/**
 * Получить количество непрочитанных сообщений
 */
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  if (error) {
    logger.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Подписка на новые сообщения (Realtime)
 */
export function subscribeToMessages(
  onNewMessage: (message: Message) => void
): () => void {
  const subscription = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();

  // Возвращаем функцию отписки
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Удалить сообщение (soft delete)
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Необходима авторизация');

  // Получаем сообщение чтобы определить роль пользователя
  const { data: message } = await supabase
    .from('messages')
    .select('sender_id, recipient_id')
    .eq('id', messageId)
    .single();

  if (!message) {
    throw new Error('Сообщение не найдено');
  }

  const updateField = message.sender_id === user.id
    ? { deleted_by_sender: true }
    : { deleted_by_recipient: true };

  const { error } = await supabase
    .from('messages')
    .update(updateField)
    .eq('id', messageId);

  if (error) {
    logger.error('Error deleting message:', error);
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}
