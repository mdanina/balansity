import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

type EmailProvider = 'smtp' | 'resend' | 'sendgrid';

interface EmailData {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}

class EmailService {
  private provider: EmailProvider;
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;

  constructor() {
    this.provider = (process.env.EMAIL_PROVIDER as EmailProvider) || 'smtp';
    this.initialize();
  }

  private initialize() {
    if (this.provider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else if (this.provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error('RESEND_API_KEY is required when using resend provider');
      }
      this.resend = new Resend(apiKey);
    }
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      const html = this.renderTemplate(data.template, data.variables);

      if (this.provider === 'smtp' && this.transporter) {
        await this.transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'Balansity'}" <${process.env.SMTP_FROM}>`,
          to: data.to,
          subject: data.subject,
          html,
        });
        logger.info(`Email sent via SMTP to ${data.to}`);
        return true;
      } else if (this.provider === 'resend' && this.resend) {
        const result = await this.resend.emails.send({
          from: process.env.SMTP_FROM || 'noreply@balansity.ru',
          to: data.to,
          subject: data.subject,
          html,
        });
        logger.info(`Email sent via Resend to ${data.to}`, result);
        return true;
      } else if (this.provider === 'sendgrid') {
        // TODO: Implement SendGrid
        logger.warn('SendGrid not implemented yet');
        return false;
      }

      return false;
    } catch (error) {
      logger.error(`Error sending email to ${data.to}:`, error);
      return false;
    }
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    const templates: Record<string, string> = {
      'checkup_completed': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ваш чекап завершен</h1>
            </div>
            <div class="content">
              <p>Здравствуйте!</p>
              <p>Чекап для <strong>${variables.profile_name || 'вашего ребенка'}</strong> успешно завершен.</p>
              <p>Вы можете просмотреть результаты в личном кабинете.</p>
              <p>Дата завершения: ${new Date(variables.completed_at).toLocaleString('ru-RU')}</p>
            </div>
            <div class="footer">
              <p>Balansity - Психическое здоровье для семей</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'appointment_confirmation': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Подтверждение записи</h1>
            </div>
            <div class="content">
              <p>Ваша запись подтверждена!</p>
              <p><strong>Тип консультации:</strong> ${variables.appointment_type}</p>
              <p><strong>Дата и время:</strong> ${new Date(variables.scheduled_at).toLocaleString('ru-RU')}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'payment_confirmation': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Подтверждение оплаты</h1>
          <p>Ваш платеж успешно обработан.</p>
          <p>Сумма: ${variables.amount} ${variables.currency || 'RUB'}</p>
        </body>
        </html>
      `,
      'appointment_reminder_24h': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Напоминание о консультации</h1>
          <p>Напоминаем, что у вас запланирована консультация через 24 часа.</p>
          <p>Дата и время: ${new Date(variables.scheduled_at).toLocaleString('ru-RU')}</p>
        </body>
        </html>
      `,
      'appointment_reminder_1h': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Напоминание о консультации</h1>
          <p>Напоминаем, что у вас запланирована консультация через 1 час.</p>
          <p>Дата и время: ${new Date(variables.scheduled_at).toLocaleString('ru-RU')}</p>
        </body>
        </html>
      `,
      'payment_failed': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <h1>Ошибка оплаты</h1>
          <p>К сожалению, произошла ошибка при обработке платежа.</p>
          <p>Сумма: ${variables.amount} ${variables.currency || 'RUB'}</p>
          <p>Пожалуйста, попробуйте еще раз.</p>
        </body>
        </html>
      `,
    };

    let html = templates[template] || '<p>Уведомление</p>';

    // Заменяем переменные в шаблоне
    Object.keys(variables).forEach((key) => {
      html = html.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), variables[key]);
    });

    return html;
  }
}

export const emailService = new EmailService();



