/**
 * Email Service — Interface for sending emails via SMTP
 *
 * Uses variables from env.ts (SMTP_HOST, SMTP_PORT, etc.)
 */
import nodemailer from 'nodemailer';
import { env } from '../env.js';
import { logger } from './logger.js';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const emailService = {
  /**
   * Send an email using SMTP
   */
  send: async (options: EmailOptions): Promise<void> => {
    // 1. Check if SMTP is configured
    if (!env.SMTP_HOST || !env.SMTP_PORT) {
      logger.warn(
        { to: options.to, subject: options.subject },
        '⚠️ SMTP not configured — logging email instead',
      );
      logger.info(
        {
          mockEmail: true,
          to: options.to,
          subject: options.subject,
          text: options.text,
        },
        'Mock email (SMTP not configured)',
      );
      return;
    }

    // 2. Create transporter
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for other ports
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
    });

    // 3. Send mail
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      logger.info({ to: options.to, subject: options.subject }, '✅ Email sent successfully');
    } catch (err) {
      logger.error({ err, to: options.to, subject: options.subject }, '❌ Failed to send email');
      throw new Error('Failed to send email. Please try again later.');
    }
  },

  /**
   * Specific template: Password Reset
   */
  sendPasswordReset: async (to: string, resetLink: string): Promise<void> => {
    await emailService.send({
      to,
      subject: 'Reset your password',
      text: `You requested a password reset. Click here to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
          <h2 style="color: #1a202c;">Reset Your Password</h2>
          <p style="color: #4a5568; line-height: 1.6;">You requested a password reset for your account. Click the button below to set a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #16569e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #718096; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;" />
          <p style="color: #a0aec0; font-size: 12px;">This link will expire in 1 hour.</p>
        </div>
      `,
    });
  },
};
