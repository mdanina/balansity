import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger.js';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Отправить сообщение в Telegram
 */
async function sendTelegramNotification(message: string): Promise<void> {
  try {
    // Получаем конфиг Telegram из БД
    const { data: config } = await supabase
      .from('telegram_config')
      .select('bot_token, chat_id')
      .eq('is_active', true)
      .single();

    if (!config?.bot_token || !config?.chat_id) {
      logger.warn('Telegram config not found or inactive');
      return;
    }

    const url = `https://api.telegram.org/bot${config.bot_token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chat_id,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Telegram API error:', error);
    }
  } catch (error) {
    logger.error('Failed to send Telegram notification:', error);
  }
}

/**
 * Извлечь appointment по названию комнаты
 */
async function findAppointmentByRoom(roomName: string): Promise<any | null> {
  try {
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        *,
        appointment_type:appointment_types(name, duration_minutes),
        profile:profiles(first_name, last_name)
      `)
      .eq('video_room_name', roomName)
      .single();

    return appointment;
  } catch (error) {
    logger.error('Error finding appointment by room:', error);
    return null;
  }
}

/**
 * Форматировать время для отображения
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// Обработчик: Участник присоединился к комнате
// ============================================
async function handleParticipantJoined(data: {
  roomName: string;
  participantName?: string;
  participantId?: string;
  isHost?: boolean;
}): Promise<{ success: boolean; warning?: string }> {
  const { roomName, participantName, isHost } = data;

  logger.info(`Jitsi participant joined: room=${roomName}, name=${participantName}, isHost=${isHost}`);

  const appointment = await findAppointmentByRoom(roomName);

  if (!appointment) {
    logger.warn(`No appointment found for room: ${roomName}`);
    return { success: true, warning: 'Room not found' };
  }

  const clientName = appointment.profile
    ? `${appointment.profile.first_name} ${appointment.profile.last_name || ''}`.trim()
    : 'Клиент';

  const appointmentType = appointment.appointment_type?.name || 'Консультация';
  const scheduledTime = formatTime(appointment.scheduled_at);

  let message: string;

  if (isHost) {
    // Специалист зашёл (модератор)
    message = `
<b>👨‍⚕️ Специалист начал сессию</b>

📋 <b>Тип:</b> ${appointmentType}
👤 <b>Клиент:</b> ${clientName}
🕐 <b>Запланировано:</b> ${scheduledTime}
👨‍⚕️ <b>Специалист:</b> ${participantName || 'Не указано'}
`.trim();

    // Обновляем статус консультации на in_progress когда специалист зашёл
    await supabase
      .from('appointments')
      .update({ status: 'in_progress' })
      .eq('id', appointment.id)
      .eq('status', 'scheduled');

  } else {
    // Клиент зашёл (гость)
    message = `
<b>👤 Клиент подключился к сессии</b>

📋 <b>Тип:</b> ${appointmentType}
👤 <b>Клиент:</b> ${clientName}
🕐 <b>Запланировано:</b> ${scheduledTime}
👋 <b>Имя в комнате:</b> ${participantName || 'Не указано'}
`.trim();
  }

  await sendTelegramNotification(message);

  return { success: true };
}

// ============================================
// Обработчик: Комната создана
// ============================================
async function handleRoomCreated(data: { roomName: string }): Promise<{ success: boolean }> {
  logger.info(`Jitsi room created: ${data.roomName}`);
  // Не отправляем уведомление - ждём participant_joined с информацией кто зашёл
  return { success: true };
}

// ============================================
// Обработчик: Комната закрыта
// ============================================
async function handleRoomDestroyed(data: {
  roomName: string;
  duration?: number;
}): Promise<{ success: boolean; warning?: string }> {
  const { roomName, duration } = data;

  logger.info(`Jitsi room destroyed: ${roomName}, duration=${duration}`);

  const appointment = await findAppointmentByRoom(roomName);

  if (!appointment) {
    logger.warn(`No appointment found for room: ${roomName}`);
    return { success: true, warning: 'Room not found' };
  }

  const clientName = appointment.profile
    ? `${appointment.profile.first_name} ${appointment.profile.last_name || ''}`.trim()
    : 'Клиент';

  const appointmentType = appointment.appointment_type?.name || 'Консультация';

  // Форматируем длительность
  const durationMinutes = duration ? Math.round(duration / 60) : null;
  const durationText = durationMinutes ? `${durationMinutes} мин` : 'неизвестно';

  const message = `
<b>🔴 Сессия завершена</b>

📋 <b>Тип:</b> ${appointmentType}
👤 <b>Клиент:</b> ${clientName}
⏱ <b>Длительность:</b> ${durationText}
🚪 <b>Комната:</b> ${roomName}
`.trim();

  await sendTelegramNotification(message);

  return { success: true };
}

// ============================================
// Обработчик: Участник покинул комнату
// ============================================
async function handleParticipantLeft(data: {
  roomName: string;
  participantName?: string;
}): Promise<{ success: boolean }> {
  logger.info(`Jitsi participant left: room=${data.roomName}, name=${data.participantName}`);
  // Просто логируем, не отправляем в Telegram (чтобы не спамить)
  return { success: true };
}

// ============================================
// HTTP Routes
// ============================================

router.post('/participant-joined', async (req: Request, res: Response) => {
  try {
    const result = await handleParticipantJoined(req.body);
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    logger.error('Error processing participant-joined webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

router.post('/room-created', async (req: Request, res: Response) => {
  try {
    const result = await handleRoomCreated(req.body);
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    logger.error('Error processing room-created webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

router.post('/room-destroyed', async (req: Request, res: Response) => {
  try {
    const result = await handleRoomDestroyed(req.body);
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    logger.error('Error processing room-destroyed webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

router.post('/participant-left', async (req: Request, res: Response) => {
  try {
    const result = await handleParticipantLeft(req.body);
    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    logger.error('Error processing participant-left webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

// ============================================
// Общий endpoint для всех событий
// ============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const { event, room_name, roomName, participant_name, participantName, participant_id, participantId, is_host, isHost, duration } = req.body;

    // Нормализуем данные (snake_case -> camelCase)
    const normalizedData = {
      roomName: room_name || roomName,
      participantName: participant_name || participantName,
      participantId: participant_id || participantId,
      isHost: is_host || isHost,
      duration,
    };

    logger.info(`Jitsi webhook received: event=${event}`, normalizedData);

    let result: { success: boolean; warning?: string };

    switch (event) {
      case 'participant_joined':
        result = await handleParticipantJoined(normalizedData);
        break;
      case 'room_created':
        result = await handleRoomCreated(normalizedData);
        break;
      case 'room_destroyed':
        result = await handleRoomDestroyed(normalizedData);
        break;
      case 'participant_left':
        result = await handleParticipantLeft(normalizedData);
        break;
      default:
        logger.debug(`Unknown Jitsi event: ${event}`);
        return res.status(200).json({ received: true, unknown_event: event });
    }

    return res.status(200).json({ received: true, ...result });
  } catch (error) {
    logger.error('Error processing Jitsi webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

export { router as jitsiWebhookRouter };
