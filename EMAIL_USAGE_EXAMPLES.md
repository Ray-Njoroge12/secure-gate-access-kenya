# Email Service Usage Examples

This document provides practical examples of how to use the email service in your Secure Gate Kenya application.

## Basic Usage

### 1. Import the Email Service

```typescript
import { emailService } from './services/emailService';
```

### 2. Send a Custom Email

```typescript
// Send a simple text email
const success = await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Secure Gate Kenya',
  text: 'Thank you for joining our platform!'
});

// Send an HTML email
const success = await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Secure Gate Kenya',
  html: '<h1>Welcome!</h1><p>Thank you for joining our platform!</p>'
});
```

## Integration Examples

### 1. User Registration

```typescript
// In your user registration route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Create user account
    const user = await createUser({ email, name });
    
    // Send welcome email
    const emailSent = await emailService.sendWelcomeEmail(email, name);
    
    if (emailSent) {
      res.json({ 
        success: true, 
        message: 'Account created and welcome email sent' 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Account created but welcome email failed' 
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

### 2. Access Code Generation

```typescript
// In your access code generation route
app.post('/api/access-codes/generate', async (req, res) => {
  try {
    const { visitorName, adminEmail } = req.body;
    
    // Generate access code
    const accessCode = generateAccessCode();
    
    // Save to database
    await saveAccessCode(accessCode, visitorName);
    
    // Send access code email
    const emailSent = await emailService.sendAccessCodeEmail(
      adminEmail, 
      accessCode, 
      visitorName
    );
    
    res.json({ 
      success: true, 
      accessCode,
      emailSent 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate access code' });
  }
});
```

### 3. User Invitations

```typescript
// In your invitation route
app.post('/api/invitations/send', async (req, res) => {
  try {
    const { email, inviterName } = req.body;
    
    // Generate invitation code
    const invitationCode = generateInvitationCode();
    
    // Save invitation to database
    await saveInvitation(email, invitationCode);
    
    // Send invitation email
    const emailSent = await emailService.sendInvitationEmail(
      email, 
      invitationCode, 
      inviterName
    );
    
    res.json({ 
      success: true, 
      invitationCode,
      emailSent 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});
```

### 4. Password Reset

```typescript
// In your password reset route
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Generate reset token
    const resetToken = generateResetToken();
    
    // Save reset token to database with expiration
    await saveResetToken(email, resetToken);
    
    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(email, resetToken);
    
    res.json({ 
      success: true, 
      message: 'Password reset email sent',
      emailSent 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});
```

## Advanced Usage

### 1. Sending to Multiple Recipients

```typescript
// Send to multiple recipients
const success = await emailService.sendEmail({
  to: ['admin1@example.com', 'admin2@example.com'],
  subject: 'Security Alert',
  html: '<h1>Security Alert</h1><p>Unauthorized access detected!</p>'
});
```

### 2. Email with Attachments

```typescript
// Send email with attachment
const success = await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Access Report',
  html: '<p>Please find the access report attached.</p>',
  attachments: [
    {
      filename: 'access-report.pdf',
      content: pdfBuffer, // Buffer containing PDF data
      contentType: 'application/pdf'
    }
  ]
});
```

### 3. Error Handling

```typescript
async function sendNotificationEmail(email: string, message: string) {
  try {
    const success = await emailService.sendEmail({
      to: email,
      subject: 'Notification',
      text: message
    });
    
    if (!success) {
      console.error('Failed to send notification email');
      // Log to database or external service
      await logEmailFailure(email, 'notification');
    }
    
    return success;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}
```

### 4. Email Queue for High Volume

```typescript
// Simple email queue implementation
class EmailQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  async add(emailFn: () => Promise<void>) {
    this.queue.push(emailFn);
    if (!this.processing) {
      this.process();
    }
  }

  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const emailFn = this.queue.shift();
      if (emailFn) {
        try {
          await emailFn();
        } catch (error) {
          console.error('Email queue error:', error);
        }
      }
    }
    
    this.processing = false;
  }
}

const emailQueue = new EmailQueue();

// Usage
emailQueue.add(async () => {
  await emailService.sendWelcomeEmail('user@example.com', 'John Doe');
});
```

## Testing

### 1. Unit Test Example

```typescript
import { emailService } from '../services/emailService';

describe('Email Service', () => {
  test('should send welcome email', async () => {
    const result = await emailService.sendWelcomeEmail(
      'test@example.com', 
      'Test User'
    );
    expect(result).toBe(true);
  });
});
```

### 2. Integration Test Example

```typescript
import request from 'supertest';
import app from '../server';

describe('Email API', () => {
  test('POST /api/email/welcome should send welcome email', async () => {
    const response = await request(app)
      .post('/api/email/welcome')
      .send({
        to: 'test@example.com',
        name: 'Test User'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Environment Configuration

Make sure your `.env` file contains:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
GMAIL_FROM_NAME=Secure Gate Kenya
FRONTEND_URL=http://localhost:3000
```

## Monitoring and Logging

```typescript
// Add logging to your email service
class LoggedEmailService extends EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const result = await super.sendEmail(options);
      const duration = Date.now() - startTime;
      
      console.log(`Email sent successfully in ${duration}ms`, {
        to: options.to,
        subject: options.subject,
        duration
      });
      
      return result;
    } catch (error) {
      console.error('Email sending failed:', {
        to: options.to,
        subject: options.subject,
        error: error.message
      });
      
      return false;
    }
  }
}
```

This comprehensive setup provides you with a robust email system that can handle various use cases in your Secure Gate Kenya application.