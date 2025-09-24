import { Router } from 'express';
import { emailService } from '../services/emailService';

const router = Router();

// Send custom email
router.post('/send', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'To and subject are required'
      });
    }

    const success = await emailService.sendEmail({
      to,
      subject,
      text,
      html
    });

    if (success) {
      res.json({
        success: true,
        message: 'Email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email'
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send welcome email
router.post('/welcome', async (req, res) => {
  try {
    const { to, name } = req.body;

    if (!to || !name) {
      return res.status(400).json({
        success: false,
        message: 'To and name are required'
      });
    }

    const success = await emailService.sendWelcomeEmail(to, name);

    if (success) {
      res.json({
        success: true,
        message: 'Welcome email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send welcome email'
      });
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send access code email
router.post('/access-code', async (req, res) => {
  try {
    const { to, code, visitorName } = req.body;

    if (!to || !code || !visitorName) {
      return res.status(400).json({
        success: false,
        message: 'To, code, and visitorName are required'
      });
    }

    const success = await emailService.sendAccessCodeEmail(to, code, visitorName);

    if (success) {
      res.json({
        success: true,
        message: 'Access code email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send access code email'
      });
    }
  } catch (error) {
    console.error('Error sending access code email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send invitation email
router.post('/invitation', async (req, res) => {
  try {
    const { to, invitationCode, inviterName } = req.body;

    if (!to || !invitationCode || !inviterName) {
      return res.status(400).json({
        success: false,
        message: 'To, invitationCode, and inviterName are required'
      });
    }

    const success = await emailService.sendInvitationEmail(to, invitationCode, inviterName);

    if (success) {
      res.json({
        success: true,
        message: 'Invitation email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation email'
      });
    }
  } catch (error) {
    console.error('Error sending invitation email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send password reset email
router.post('/password-reset', async (req, res) => {
  try {
    const { to, resetToken } = req.body;

    if (!to || !resetToken) {
      return res.status(400).json({
        success: false,
        message: 'To and resetToken are required'
      });
    }

    const success = await emailService.sendPasswordResetEmail(to, resetToken);

    if (success) {
      res.json({
        success: true,
        message: 'Password reset email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Test email service connection
router.get('/test', async (req, res) => {
  try {
    // Try to send a test email to verify the service is working
    const testEmail = process.env.GMAIL_USER;
    
    if (!testEmail) {
      return res.status(500).json({
        success: false,
        message: 'Gmail user not configured'
      });
    }

    const success = await emailService.sendEmail({
      to: testEmail,
      subject: 'Test Email - Secure Gate Kenya',
      text: 'This is a test email to verify the email service is working correctly.',
      html: '<p>This is a test email to verify the email service is working correctly.</p>'
    });

    if (success) {
      res.json({
        success: true,
        message: 'Email service is working correctly'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email service test failed'
      });
    }
  } catch (error) {
    console.error('Error testing email service:', error);
    res.status(500).json({
      success: false,
      message: 'Email service test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as emailRouter };