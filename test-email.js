// Simple test script for email functionality
const { sendContactFormEmail, sendPasswordResetEmail } = require('./server/email');

async function testEmails() {
  console.log('Testing email functionality...');

  // Test contact form email
  console.log('\n=== Testing contact form email ===');
  await sendContactFormEmail(
    'Test User',
    'test@example.com',
    'Test Contact Form Message',
    'This is a test message from the contact form.\n\nMultiple lines to test formatting.'
  );

  // Test password reset email
  console.log('\n=== Testing password reset email ===');
  await sendPasswordResetEmail(
    'user@example.com',
    'sample-reset-token-123456',
    'TestUser'
  );

  console.log('\nEmail tests completed!');
}

testEmails().catch(console.error);