import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config();

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      throw new Error('Failed to connect to email service');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: process.env.GMAIL_FROM_NAME || 'Secure Gate Kenya',
          address: process.env.GMAIL_USER!,
        },
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  // Predefined email templates
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Secure Gate Kenya!</h2>
        <p>Hello ${name},</p>
        <p>Welcome to our secure access management system. Your account has been successfully created.</p>
        <p>You can now:</p>
        <ul>
          <li>Generate access codes for visitors</li>
          <li>Monitor access logs in real-time</li>
          <li>Manage visitor invitations</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <br>
        <p>Best regards,<br>Secure Gate Kenya Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Welcome to Secure Gate Kenya',
      html,
    });
  }

  async sendAccessCodeEmail(to: string, code: string, visitorName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Access Code Generated</h2>
        <p>Hello,</p>
        <p>An access code has been generated for visitor: <strong>${visitorName}</strong></p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
        </div>
        <p>This code is valid for the next 24 hours. Please share it with the visitor.</p>
        <p>Best regards,<br>Secure Gate Kenya Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Access Code for ${visitorName}`,
      html,
    });
  }

  async sendInvitationEmail(to: string, invitationCode: string, inviterName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">You're Invited to Secure Gate Kenya</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to join Secure Gate Kenya.</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h3 style="color: #1f2937; margin: 0;">Invitation Code</h3>
          <h1 style="color: #2563eb; font-size: 28px; margin: 10px 0; letter-spacing: 2px;">${invitationCode}</h1>
        </div>
        <p>Use this code to complete your registration and access the system.</p>
        <p>Best regards,<br>Secure Gate Kenya Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Invitation to Secure Gate Kenya',
      html,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your Secure Gate Kenya account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>Secure Gate Kenya Team</p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Password Reset - Secure Gate Kenya',
      html,
    });
  }
}

export const emailService = new EmailService();
export default EmailService;