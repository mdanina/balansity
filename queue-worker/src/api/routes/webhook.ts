import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../../utils/logger.js';
import { verifyYooKassaPayment } from '../../services/yookassa.js';

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

// Разрешённые IP-адреса ЮKassa для webhook
const YOOKASSA_IPS = [
  '185.71.76.0/27',
  '185.71.77.0/27',
  '77.75.153.0/25',
  '77.75.156.11',
  '77.75.156.35',
  '77.75.154.128/25',
  '2a02:5180::/32',
];

/**
 * Проверяет, входит ли IP в разрешённый диапазон ЮКасса
 * Упрощённая проверка для основных IP
 */
function isYooKassaIP(ip: string): boolean {
  // Убираем IPv6-маппинг если есть
  const cleanIP = ip.replace(/^::ffff:/, '');

  // В development режиме пропускаем проверку
  if (process.env.NODE_ENV === 'development') {
    logger.warn(`Skipping IP check in development mode: ${cleanIP}`);
    return true;
  }

  // Проверяем конкретные IP
  if (cleanIP === '77.75.156.11' || cleanIP === '77.75.156.35') {
    return true;
  }

  // Проверяем диапазоны (упрощённо)
  if (cleanIP.startsWith('185.71.76.') || cleanIP.startsWith('185.71.77.')) {
    return true;
  }
  if (cleanIP.startsWith('77.75.153.') || cleanIP.startsWith('77.75.154.')) {
    return true;
  }

  return false;
}

// Webhook от ЮKassa
router.post('/yookassa', async (req: Request, res: Response) => {
  // ВАЖНО: Всегда возвращаем 200, чтобы ЮКасса не делала retry
  // Ошибки логируем, но не отдаём клиенту
  try {
    // Проверяем IP отправителя
    const clientIP = req.ip || req.socket.remoteAddress || '';
    if (!isYooKassaIP(clientIP)) {
      logger.warn(`Webhook rejected: unauthorized IP ${clientIP}`);
      return res.status(200).json({ received: true, warning: 'IP not authorized' });
    }

    const webhookData = req.body;
    const event = webhookData.event;
    const object = webhookData.object;

    logger.info(`Received YooKassa webhook: event=${event}, payment_id=${object.id}, ip=${clientIP}`);

    if (event !== 'payment.succeeded' && event !== 'payment.canceled') {
      logger.debug(`Ignoring webhook event: ${event}`);
      return res.status(200).json({ received: true });
    }

    const paymentId = object.metadata?.payment_id;
    if (!paymentId) {
      logger.warn('Payment ID not found in webhook metadata');
      return res.status(200).json({ received: true, warning: 'No payment_id in metadata' });
    }

    const externalPaymentId = object.id;

    // КРИТИЧНО: Верифицируем статус через API ЮКасса (защита от подделки webhook)
    let verifiedStatus: string;
    let verifiedAmount: string;
    try {
      const verification = await verifyYooKassaPayment(externalPaymentId);
      verifiedStatus = verification.status;
      verifiedAmount = verification.amount.value;
      logger.info(`Verified payment ${externalPaymentId}: status=${verifiedStatus}, amount=${verifiedAmount}`);
    } catch (verifyError) {
      logger.error(`Failed to verify payment ${externalPaymentId} with YooKassa API:`, verifyError);
      // Не обрабатываем webhook если не можем верифицировать
      return res.status(200).json({ received: true, warning: 'Verification failed' });
    }

    // Получаем текущий платёж из БД
    const { data: existingPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !existingPayment) {
      logger.warn(`Payment ${paymentId} not found in database`);
      return res.status(200).json({ received: true, warning: 'Payment not found' });
    }

    // ИДЕМПОТЕНТНОСТЬ: Проверяем, не обработан ли уже этот платёж
    if (existingPayment.status === 'completed' || existingPayment.status === 'failed') {
      logger.info(`Payment ${paymentId} already processed with status: ${existingPayment.status}`);
      return res.status(200).json({ received: true, already_processed: true });
    }

    // Проверяем сумму
    const expectedAmount = parseFloat(existingPayment.amount).toFixed(2);
    if (verifiedAmount !== expectedAmount) {
      logger.error(`Amount mismatch for payment ${paymentId}: expected ${expectedAmount}, got ${verifiedAmount}`);
      return res.status(200).json({ received: true, warning: 'Amount mismatch' });
    }

    // Определяем новый статус на основе ВЕРИФИЦИРОВАННОГО статуса
    let newStatus = 'pending';
    if (verifiedStatus === 'succeeded') {
      newStatus = 'completed';
    } else if (verifiedStatus === 'canceled') {
      newStatus = 'failed';
    } else {
      logger.info(`Payment ${paymentId} status is ${verifiedStatus}, skipping update`);
      return res.status(200).json({ received: true });
    }

    logger.info(`Updating payment ${paymentId} to status: ${newStatus}`);

    // Обновляем статус платежа (только если текущий статус pending)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', paymentId)
      .eq('status', 'pending') // Дополнительная защита от race condition
      .select()
      .single();

    if (paymentError) {
      // Если ошибка "no rows returned" - значит платёж уже обработан (race condition)
      if (paymentError.code === 'PGRST116') {
        logger.info(`Payment ${paymentId} was already processed by another request`);
        return res.status(200).json({ received: true, already_processed: true });
      }
      logger.error('Error updating payment status from webhook:', paymentError);
      return res.status(200).json({ received: true, warning: 'Database error' });
    }

    // Если платеж завершен, обновляем связанные записи или создаем новые
    if (newStatus === 'completed' && payment && payment.metadata) {
      const metadata = payment.metadata as any;

      // Если есть appointment_id - обновляем существующую запись
      if (metadata.appointment_id) {
        await supabase
          .from('appointments')
          .update({ payment_id: payment.id })
          .eq('id', metadata.appointment_id);
        logger.info(`Updated appointment ${metadata.appointment_id} with payment ${payment.id}`);
      }
      // Если нет appointment_id, но есть данные для создания - создаем новую запись
      else if (metadata.appointment_type_id && metadata.scheduled_at) {
        // ИДЕМПОТЕНТНОСТЬ: Проверяем, не создан ли уже appointment для этого платежа
        const { data: existingAppointment } = await supabase
          .from('appointments')
          .select('id')
          .eq('payment_id', payment.id)
          .single();

        if (existingAppointment) {
          logger.info(`Appointment already exists for payment ${payment.id}: ${existingAppointment.id}`);
        } else {
          const { data: newAppointment, error: createError } = await supabase
            .from('appointments')
            .insert({
              user_id: payment.user_id,
              appointment_type_id: metadata.appointment_type_id,
              scheduled_at: metadata.scheduled_at,
              profile_id: metadata.profile_id || null,
              status: 'scheduled',
              payment_id: payment.id,
            })
            .select()
            .single();

          if (createError) {
            // Если ошибка unique constraint - appointment уже создан (race condition)
            if (createError.code === '23505') {
              logger.info(`Appointment already created for payment ${payment.id} (concurrent request)`);
            } else {
              logger.error(`Error creating appointment from payment ${payment.id}:`, createError);
            }
          } else {
            logger.info(`Appointment ${newAppointment.id} created from payment ${payment.id}`);
          }
        }
      }

      if (metadata.package_id) {
        // Логика для пакетов (можно добавить позже)
        logger.info(`Package purchase ${metadata.package_id} completed`);
      }
    }

    logger.info(`Webhook processed successfully for payment ${paymentId}`);

    return res.status(200).json({ received: true, success: true });
  } catch (error: any) {
    // ВАЖНО: Всегда возвращаем 200, чтобы ЮКасса не делала retry
    logger.error('Webhook error:', error);
    return res.status(200).json({ received: true, warning: 'Internal error logged' });
  }
});

export { router as webhookRouter };

