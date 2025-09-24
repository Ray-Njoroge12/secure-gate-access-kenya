# Gmail Setup Guide for Nodemailer

This guide will help you connect your Gmail account to Nodemailer for sending emails from your Node.js application.

## Prerequisites

- A Gmail account
- 2-Factor Authentication enabled on your Gmail account
- Node.js project with Nodemailer installed

## Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2FA if not already enabled

## Step 2: Generate App Password

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down to **App passwords**
4. Click **App passwords**
5. Select **Mail** as the app
6. Select **Other (Custom name)** and enter "Secure Gate Kenya"
7. Click **Generate**
8. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

## Step 3: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit your `.env` file with your Gmail credentials:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   GMAIL_FROM_NAME=Secure Gate Kenya
   FRONTEND_URL=http://localhost:3000
   ```

## Step 4: Test the Email Service

1. Start your server:
   ```bash
   npm run dev:api
   ```

2. Test the email service:
   ```bash
   curl -X GET http://localhost:4001/api/email/test
   ```

## Available Email Endpoints

### 1. Test Email Service
```bash
GET /api/email/test
```

### 2. Send Custom Email
```bash
POST /api/email/send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "text": "Plain text content",
  "html": "<p>HTML content</p>"
}
```

### 3. Send Welcome Email
```bash
POST /api/email/welcome
Content-Type: application/json

{
  "to": "newuser@example.com",
  "name": "John Doe"
}
```

### 4. Send Access Code Email
```bash
POST /api/email/access-code
Content-Type: application/json

{
  "to": "admin@example.com",
  "code": "123456",
  "visitorName": "Jane Smith"
}
```

### 5. Send Invitation Email
```bash
POST /api/email/invitation
Content-Type: application/json

{
  "to": "invitee@example.com",
  "invitationCode": "INV123456",
  "inviterName": "Admin User"
}
```

### 6. Send Password Reset Email
```bash
POST /api/email/password-reset
Content-Type: application/json

{
  "to": "user@example.com",
  "resetToken": "reset-token-here"
}
```

## Usage in Your Code

```typescript
import { emailService } from './services/emailService';

// Send a custom email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to our platform!</h1>'
});

// Send a welcome email
await emailService.sendWelcomeEmail('user@example.com', 'John Doe');

// Send an access code
await emailService.sendAccessCodeEmail('admin@example.com', '123456', 'Jane Smith');
```

## Troubleshooting

### Common Issues

1. **"Invalid login" error**: Make sure you're using the App Password, not your regular Gmail password
2. **"Less secure app access" error**: This means 2FA is not enabled. Enable it and use App Passwords instead
3. **Connection timeout**: Check your internet connection and firewall settings
4. **"Username and Password not accepted"**: Verify your Gmail credentials and App Password

### Security Notes

- Never commit your `.env` file to version control
- Use App Passwords instead of your main Gmail password
- Consider using environment-specific configurations for different deployments
- Regularly rotate your App Passwords

## Production Considerations

1. **Rate Limiting**: Gmail has sending limits (500 emails per day for free accounts)
2. **Monitoring**: Implement logging and monitoring for email delivery
3. **Error Handling**: Add proper error handling and retry mechanisms
4. **Templates**: Consider using a template engine for complex email layouts
5. **Queue System**: For high-volume sending, consider using a queue system like Bull or Agenda

## Alternative Email Services

If you need higher sending limits or better deliverability, consider:
- SendGrid
- Mailgun
- Amazon SES
- Postmark

These services can be easily integrated by modifying the transporter configuration in `emailService.ts`.