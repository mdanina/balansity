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

// IP сервера Jitsi для проверки (опционально)
const JITSI_SERVER_IP = process.env.JITSI_SERVER_IP || '155.212.186.130';

// Секретный ключ для верификации вебхуков (настраивается в Jitsi)
const JITSI_WEBHOOK_SECRET = process.env.JITSI_WEBHOOK_SECRET || '';

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
 * Извлечь appointment_id из названия комнаты
 * Формат комнаты: konsultaciya-DDmon-XXXXXX
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
// Webhook: Участник присоединился к комнате
// ============================================
router.post('/participant-joined', async (req: Request, res: Response) => {
  try {
    const { roomName, participantName, participantId, isHost } = req.body;

    logger.info(`Jitsi participant joined: room=${roomName}, name=${participantName}, isHost=${isHost}`);

    // Находим консультацию по комнате
    const appointment = await findAppointmentByRoom(roomName);

    if (!appointment) {
      logger.warn(`No appointment found for room: ${roomName}`);
      return res.status(200).json({ received: true, warning: 'Room not found' });
    }

    const clientName = appointment.profile
      ? `${appointment.profile.first_name} ${appointment.profile.last_name || ''}`.trim()
      : 'Клиент';

    const appointmentType = appointment.appointment_type?.name || 'Консультация';
    const scheduledTime = formatTime(appointment.scheduled_at);

    // Определяем, кто зашёл (специалист или клиент)
    // Если isHost = true, это модератор (специалист)
    const whoJoined = isHost ? 'Специалист' : 'Клиент';

    const message = `
<b>👤 ${whoJoined} подключился к консультации</b>

📋 <b>Тип:</b> ${appointmentType}
👤 <b>Клиент:</b> ${clientName}
🕐 <b>Запланировано:</b> ${scheduledTime}
🚪 <b>Комната:</b> ${roomName}
👋 <b>Подключился:</b> ${participantName || 'Участник'}
`.trim();

    await sendTelegramNotification(message);

    return res.status(200).json({ received: true, success: true });
  } catch (error) {
    logger.error('Error processing participant-joined webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

// ============================================
// Webhook: Комната создана (первый участник зашёл)
// ============================================
router.post('/room-created', async (req: Request, res: Response) => {
  try {
    const { roomName, createdAt } = req.body;

    logger.info(`Jitsi room created: ${roomName}`);

    const appointment = await findAppointmentByRoom(roomName);

    if (!appointment) {
      logger.warn(`No appointment found for room: ${roomName}`);
      return res.status(200).json({ received: true, warning: 'Room not found' });
    }

    const clientName = appointment.profile
      ? `${appointment.profile.first_name} ${appointment.profile.last_name || ''}`.trim()
      : 'Клиент';

    const appointmentType = appointment.appointment_type?.name || 'Консультация';
    const scheduledTime = formatTime(appointment.scheduled_at);

    const message = `
<b>🟢 Сессия началась</b>

📋 <b>Тип:</b> ${appointmentType}
👤 <b>Клиент:</b> ${clientName}
🕐 <b>Запланировано:</b> ${scheduledTime}
🚪 <b>Комната:</b> ${roomName}
`.trim();

    await sendTelegramNotification(message);

    // Обновляем статус консультации на in_progress
    await supabase
      .from('appointments')
      .update({ status: 'in_progress' })
      .eq('id', appointment.id)
      .eq('status', 'scheduled');

    return res.status(200).json({ received: true, success: true });
  } catch (error) {
    logger.error('Error processing room-created webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

// ============================================
// Webhook: Комната закрыта (все вышли)
// ============================================
router.post('/room-destroyed', async (req: Request, res: Response) => {
  try {
    const { roomName, duration } = req.body;

    logger.info(`Jitsi room destroyed: ${roomName}, duration=${duration}`);

    const appointment = await findAppointmentByRoom(roomName);

    if (!appointment) {
      logger.warn(`No appointment found for room: ${roomName}`);
      return res.status(200).json({ received: true, warning: 'Room not found' });
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

    return res.status(200).json({ received: true, success: true });
  } catch (error) {
    logger.error('Error processing room-destroyed webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

// ============================================
// Webhook: Участник покинул комнату
// ============================================
router.post('/participant-left', async (req: Request, res: Response) => {
  try {
    const { roomName, participantName, participantId } = req.body;

    logger.info(`Jitsi participant left: room=${roomName}, name=${participantName}`);

    // Просто логируем, не отправляем в Telegram (чтобы не спамить)
    return res.status(200).json({ received: true, success: true });
  } catch (error) {
    logger.error('Error processing participant-left webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

// ============================================
// Общий endpoint для всех событий (если Jitsi шлёт одним URL)
// ============================================
router.post('/', async (req: Request, res: Response) => {
  try {
    const { event, ...data } = req.body;

    logger.info(`Jitsi webhook received: event=${event}`, data);

    switch (event) {
      case 'participant_joined':
        return router.handle({ ...req, url: '/participant-joined', body: data } as any, res, () => {});
      case 'room_created':
        return router.handle({ ...req, url: '/room-created', body: data } as any, res, () => {});
      case 'room_destroyed':
        return router.handle({ ...req, url: '/room-destroyed', body: data } as any, res, () => {});
      case 'participant_left':
        return router.handle({ ...req, url: '/participant-left', body: data } as any, res, () => {});
      default:
        logger.debug(`Unknown Jitsi event: ${event}`);
        return res.status(200).json({ received: true, unknown_event: event });
    }
  } catch (error) {
    logger.error('Error processing Jitsi webhook:', error);
    return res.status(200).json({ received: true, warning: 'Error logged' });
  }
});

export { router as jitsiWebhookRouter };
