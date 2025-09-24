#!/usr/bin/env tsx

/**
 * Email Service Test Script (TypeScript)
 * 
 * This script tests the email service configuration and sends a test email.
 * Run with: npx tsx test-email.ts
 */

import 'dotenv/config';
import { emailService } from './server/services/emailService';

async function testEmailService(): Promise<void> {
  console.log('🧪 Testing Email Service Configuration...\n');

  // Check environment variables
  const requiredEnvVars = ['GMAIL_USER', 'GMAIL_APP_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('See GMAIL_SETUP_GUIDE.md for detailed setup instructions.');
    process.exit(1);
  }

  console.log('✅ Environment variables configured');
  console.log(`📧 Gmail User: ${process.env.GMAIL_USER}`);
  console.log(`🔐 App Password: ${'*'.repeat(16)}`);
  console.log(`📝 From Name: ${process.env.GMAIL_FROM_NAME || 'Secure Gate Kenya'}\n`);

  try {
    // Test 1: Send a simple test email
    console.log('📤 Sending test email...');
    const testEmailSuccess = await emailService.sendEmail({
      to: process.env.GMAIL_USER!,
      subject: 'Test Email - Secure Gate Kenya',
      text: 'This is a test email to verify the email service is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">✅ Email Service Test Successful!</h2>
          <p>This is a test email to verify the email service is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>Gmail User: ${process.env.GMAIL_USER}</li>
            <li>From Name: ${process.env.GMAIL_FROM_NAME || 'Secure Gate Kenya'}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
          </ul>
          <p>If you received this email, your Nodemailer configuration is working perfectly! 🎉</p>
        </div>
      `
    });

    if (testEmailSuccess) {
      console.log('✅ Test email sent successfully!');
    } else {
      console.log('❌ Failed to send test email');
      process.exit(1);
    }

    // Test 2: Send a welcome email
    console.log('\n📤 Sending welcome email test...');
    const welcomeEmailSuccess = await emailService.sendWelcomeEmail(
      process.env.GMAIL_USER!,
      'Test User'
    );

    if (welcomeEmailSuccess) {
      console.log('✅ Welcome email sent successfully!');
    } else {
      console.log('❌ Failed to send welcome email');
    }

    // Test 3: Send an access code email
    console.log('\n📤 Sending access code email test...');
    const accessCodeEmailSuccess = await emailService.sendAccessCodeEmail(
      process.env.GMAIL_USER!,
      '123456',
      'Test Visitor'
    );

    if (accessCodeEmailSuccess) {
      console.log('✅ Access code email sent successfully!');
    } else {
      console.log('❌ Failed to send access code email');
    }

    console.log('\n🎉 Email service testing completed!');
    console.log('Check your Gmail inbox for the test emails.');

  } catch (error) {
    console.error('❌ Error testing email service:', (error as Error).message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Verify your Gmail credentials in the .env file');
    console.error('2. Ensure 2-Factor Authentication is enabled on your Gmail account');
    console.error('3. Make sure you\'re using an App Password, not your regular password');
    console.error('4. Check your internet connection');
    console.error('5. See GMAIL_SETUP_GUIDE.md for detailed setup instructions');
    process.exit(1);
  }
}

// Run the test
testEmailService().catch(console.error);