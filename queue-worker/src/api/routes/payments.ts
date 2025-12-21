import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { createYooKassaPayment, verifyYooKassaPayment } from '../../services/yookassa.js';
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

// Расширяем Request для добавления user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
    }
  }
}

// Middleware для проверки авторизации
router.use(async (req: Request, res: Response, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Invalid token in payment API request');
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };
    next();
  } catch (error) {
    logger.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Константы для валидации платежей
const MIN_PAYMENT_AMOUNT = 1; // Минимум 1 рубль
const MAX_PAYMENT_AMOUNT = 1000000; // Максимум 1 млн рублей
const ALLOWED_CURRENCIES = ['RUB'];

// Создание платежа
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'RUB', metadata } = req.body;
    const userId = req.user!.id;

    // Валидация суммы
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return res.status(400).json({ error: 'Amount must be a valid number' });
    }

    if (amount < MIN_PAYMENT_AMOUNT) {
      return res.status(400).json({ error: `Amount must be at least ${MIN_PAYMENT_AMOUNT} ${currency}` });
    }

    if (amount > MAX_PAYMENT_AMOUNT) {
      return res.status(400).json({ error: `Amount cannot exceed ${MAX_PAYMENT_AMOUNT} ${currency}` });
    }

    // Проверяем, что сумма имеет не более 2 знаков после запятой
    if (Math.round(amount * 100) !== amount * 100) {
      return res.status(400).json({ error: 'Amount can have at most 2 decimal places' });
    }

    // Валидация валюты
    if (!ALLOWED_CURRENCIES.includes(currency)) {
      return res.status(400).json({ error: `Currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}` });
    }

    logger.info(`Creating payment for user ${userId}, amount: ${amount} ${currency}`);

    // Создаем запись платежа в БД
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount,
        currency,
        payment_method: 'yookassa',
        status: 'pending',
        metadata: metadata || null,
      })
      .select()
      .single();

    if (paymentError) {
      logger.error('Error creating payment in DB:', paymentError);
      throw paymentError;
    }

    // Получаем описание для платежа
    let description = 'Оплата консультации';
    if (metadata?.appointment_type_id) {
      const { data: appointmentType } = await supabase
        .from('appointment_types')
        .select('name')
        .eq('id', metadata.appointment_type_id)
        .single();
      if (appointmentType) {
        description = `Консультация: ${appointmentType.name}`;
      }
    } else if (metadata?.package_id) {
      const { data: pkg } = await supabase
        .from('packages')
        .select('name')
        .eq('id', metadata.package_id)
        .single();
      if (pkg) {
        description = `Пакет: ${pkg.name}`;
      }
    }

    // Получаем email пользователя
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    // Формируем webhook URL
    const apiBaseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL || '';
    const webhookUrl = `${apiBaseUrl}/api/webhook/yookassa`;

    // Создаем платеж в ЮKassa
    const yukassaData = await createYooKassaPayment({
      amount,
      currency,
      description,
      paymentId: payment.id,
      userId,
      email: userData?.email || req.user!.email || '',
      metadata: metadata || {},
      webhookUrl,
    });

    // Обновляем платеж с external_payment_id
    await supabase
      .from('payments')
      .update({ external_payment_id: yukassaData.id })
      .eq('id', payment.id);

    logger.info(`Payment created successfully: ${payment.id}, YooKassa ID: ${yukassaData.id}`);

    res.json({
      payment_id: payment.id,
      confirmation_token: yukassaData.confirmation.confirmation_token,
    });
  } catch (error: any) {
    logger.error('Error creating payment:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Проверка статуса платежа
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { payment_id } = req.body;
    const userId = req.user!.id;

    if (!payment_id) {
      return res.status(400).json({ error: 'Payment ID required' });
    }

    logger.info(`Verifying payment ${payment_id} for user ${userId}`);

    // Получаем платеж из БД
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .eq('user_id', userId)
      .single();

    if (paymentError || !payment) {
      logger.warn(`Payment not found: ${payment_id}`);
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Если уже завершен
    if (payment.status === 'completed') {
      return res.json({ status: payment.status, payment });
    }

    // Проверяем статус в ЮKassa
    if (!payment.external_payment_id) {
      return res.status(400).json({ error: 'External payment ID not found' });
    }

    const yukassaData = await verifyYooKassaPayment(payment.external_payment_id);
    const yukassaStatus = yukassaData.status;

    // Обновляем статус в БД
    let newStatus = 'pending';
    if (yukassaStatus === 'succeeded') {
      newStatus = 'completed';
    } else if (yukassaStatus === 'canceled') {
      newStatus = 'failed';
    } else if (yukassaStatus === 'pending' || yukassaStatus === 'waiting_for_capture') {
      newStatus = 'processing';
    }

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', payment_id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating payment status:', updateError);
      throw updateError;
    }

    // Если платеж завершен, обновляем связанные записи или создаем новые
    if (newStatus === 'completed' && payment.metadata) {
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

    logger.info(`Payment ${payment_id} verified, status: ${newStatus}`);

    res.json({ status: newStatus, payment: updatedPayment });
  } catch (error: any) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export { router as paymentsRouter };

