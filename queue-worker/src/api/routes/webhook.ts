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

// Webhook от ЮKassa (без авторизации)
router.post('/yookassa', async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;
    const event = webhookData.event;
    const object = webhookData.object;

    logger.info(`Received YooKassa webhook: event=${event}, payment_id=${object.id}`);

    if (event !== 'payment.succeeded' && event !== 'payment.canceled') {
      logger.debug(`Ignoring webhook event: ${event}`);
      return res.json({ received: true });
    }

    const paymentId = object.metadata?.payment_id;
    if (!paymentId) {
      logger.warn('Payment ID not found in webhook metadata');
      return res.status(400).json({ error: 'Payment ID not found in metadata' });
    }

    const status = object.status;
    let newStatus = 'pending';

    if (status === 'succeeded') {
      newStatus = 'completed';
    } else if (status === 'canceled') {
      newStatus = 'failed';
    }

    logger.info(`Updating payment ${paymentId} to status: ${newStatus}`);

    // Обновляем статус платежа
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', paymentId)
      .select()
      .single();

    if (paymentError) {
      logger.error('Error updating payment status from webhook:', paymentError);
      throw paymentError;
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
          logger.error(`Error creating appointment from payment ${payment.id}:`, createError);
        } else {
          logger.info(`Appointment ${newAppointment.id} created from payment ${payment.id}`);
        }
      }

      if (metadata.package_id) {
        // Логика для пакетов (можно добавить позже)
        logger.info(`Package purchase ${metadata.package_id} completed`);
      }
    }

    logger.info(`Webhook processed successfully for payment ${paymentId}`);

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export { router as webhookRouter };

