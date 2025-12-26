import { logger } from '../utils/logger.js';

const YUKASSA_SHOP_ID = process.env.YUKASSA_SHOP_ID;
const YUKASSA_SECRET_KEY = process.env.YUKASSA_SECRET_KEY;

if (!YUKASSA_SHOP_ID || !YUKASSA_SECRET_KEY) {
  logger.warn('YUKASSA_SHOP_ID or YUKASSA_SECRET_KEY not set. YooKassa integration will not work.');
}

/**
 * Формирует заголовок Basic Auth для запросов к ЮKassa API
 */
function getAuthHeader(): string {
  if (!YUKASSA_SHOP_ID || !YUKASSA_SECRET_KEY) {
    throw new Error('YooKassa credentials not configured');
  }
  const credentials = `${YUKASSA_SHOP_ID}:${YUKASSA_SECRET_KEY}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  description: string;
  paymentId: string;
  userId: string;
  email: string;
  metadata: Record<string, any>;
  webhookUrl: string;
}

export interface YooKassaPaymentResponse {
  id: string;
  status: string;
  confirmation: {
    type: string;
    confirmation_token: string;
  };
  amount: {
    value: string;
    currency: string;
  };
  metadata: Record<string, any>;
}

export interface YooKassaPaymentStatus {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  amount: {
    value: string;
    currency: string;
  };
  metadata: Record<string, any>;
}

/**
 * Создает платеж в ЮKassa
 */
export async function createYooKassaPayment(
  params: CreatePaymentParams
): Promise<YooKassaPaymentResponse> {
  if (!YUKASSA_SHOP_ID || !YUKASSA_SECRET_KEY) {
    throw new Error('YooKassa credentials not configured');
  }

  const payload = {
    amount: {
      value: params.amount.toFixed(2),
      currency: params.currency,
    },
    capture: true,
    confirmation: {
      type: 'embedded',
    },
    description: params.description,
    metadata: {
      payment_id: params.paymentId,
      user_id: params.userId,
      ...params.metadata,
    },
    notification_url: params.webhookUrl,
    receipt: {
      customer: {
        email: params.email,
      },
      tax_system_code: 3, // УСН доходы-расходы
      items: [
        {
          description: params.description,
          quantity: '1',
          amount: {
            value: params.amount.toFixed(2),
            currency: params.currency,
          },
          vat_code: 6, // НДС не облагается
          payment_mode: 'full_payment',
          payment_subject: 'service',
        },
      ],
    },
  };

  try {
    logger.info(`Creating YooKassa payment: ${params.paymentId}, amount: ${params.amount} ${params.currency}`);

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
        'Idempotence-Key': params.paymentId, // Используем payment.id как idempotency key
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`YooKassa API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`YooKassa API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as YooKassaPaymentResponse;
    logger.info(`YooKassa payment created: ${data.id}, status: ${data.status}`);
    return data;
  } catch (error) {
    logger.error('Error creating YooKassa payment:', error);
    throw error;
  }
}

/**
 * Проверяет статус платежа в ЮKassa
 */
export async function verifyYooKassaPayment(
  externalPaymentId: string
): Promise<YooKassaPaymentStatus> {
  if (!YUKASSA_SHOP_ID || !YUKASSA_SECRET_KEY) {
    throw new Error('YooKassa credentials not configured');
  }

  try {
    logger.info(`Verifying YooKassa payment: ${externalPaymentId}`);

    const response = await fetch(
      `https://api.yookassa.ru/v3/payments/${externalPaymentId}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`YooKassa API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to verify payment with YooKassa: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as YooKassaPaymentStatus;
    logger.info(`YooKassa payment status: ${data.id}, status: ${data.status}`);
    return data;
  } catch (error) {
    logger.error('Error verifying YooKassa payment:', error);
    throw error;
  }
}







