import { log } from './vite';

// Email interface
interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

// Create a development "transporter" that just logs emails to console
const sendMail = async (mailOptions: EmailOptions) => {
  log('========== EMAIL WOULD BE SENT ==========', 'email');
  log(`From: ${mailOptions.from}`, 'email');
  log(`To: ${mailOptions.to}`, 'email');
  log(`Subject: ${mailOptions.subject}`, 'email');
  log(`Text: ${mailOptions.text?.substring(0, 100)}...${mailOptions.text && mailOptions.text.length > 100 ? '...' : ''}`, 'email');
  if (mailOptions.html) {
    log(`HTML: ${mailOptions.html?.substring(0, 100)}...${mailOptions.html.length > 100 ? '...' : ''}`, 'email');
  }
  if (mailOptions.replyTo) {
    log(`Reply-To: ${mailOptions.replyTo}`, 'email');
  }
  log('=======================================', 'email');
  
  // In a real environment, this is where you would connect to an SMTP server
  // or use a service like SendGrid, Mailgun, etc.
  
  // Return a success response like an actual transporter would
  return {
    accepted: [mailOptions.to],
    rejected: [],
    response: 'Development mode - email not actually sent',
    messageId: `dev-${Date.now()}@witherco.org`,
  };
};

/**
 * Send a password reset email 
 */
export const sendPasswordResetEmail = async (
  to: string, 
  resetToken: string,
  username: string
): Promise<boolean> => {
  try {
    // Generate reset URL - hard-coding the URL for development 
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'password-reset@witherco.org',
      to,
      subject: 'Guard-shin Password Reset',
      text: `
Hello ${username},

You recently requested to reset your password for your Guard-shin account. Use the link below to reset it. This password reset link is only valid for 1 hour.

${resetUrl}

If you did not request a password reset, you can safely ignore this email. Only a person with access to your email can reset your account password.

Thanks,
The Guard-shin Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(to right, #7289DA, #5865F2); padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 10px; font-size: 12px; color: #999; }
    .button { display: inline-block; background-color: #5865F2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reset Your Password</h1>
  </div>
  <div class="content">
    <p>Hello ${username},</p>
    <p>You recently requested to reset your password for your Guard-shin account. Click the button below to reset it. This password reset link is only valid for 1 hour.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>If you did not request a password reset, you can safely ignore this email. Only a person with access to your email can reset your account password.</p>
    <p>Thanks,<br>The Guard-shin Team</p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Guard-shin. All rights reserved.</p>
  </div>
</body>
</html>
      `,
    };

    await sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Send a contact form submission email
 */
export const sendContactFormEmail = async (
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    const to = process.env.CONTACT_EMAIL || 'support@witherco.org';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'contact@witherco.org',
      to,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      text: `
New contact form submission from Guard-shin website:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Contact Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(to right, #7289DA, #5865F2); padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 10px; font-size: 12px; color: #999; }
    .field { margin-bottom: 10px; }
    .label { font-weight: bold; }
    .message { background: #fff; padding: 15px; border-radius: 4px; border-left: 4px solid #5865F2; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Contact Form Submission</h1>
  </div>
  <div class="content">
    <p>You've received a new contact form submission from the Guard-shin website:</p>
    
    <div class="field">
      <div class="label">Name:</div>
      <div>${name}</div>
    </div>
    
    <div class="field">
      <div class="label">Email:</div>
      <div>${email}</div>
    </div>
    
    <div class="field">
      <div class="label">Subject:</div>
      <div>${subject}</div>
    </div>
    
    <div class="field">
      <div class="label">Message:</div>
      <div class="message">${message.replace(/\n/g, '<br>')}</div>
    </div>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Guard-shin. All rights reserved.</p>
  </div>
</body>
</html>
      `,
    };

    await sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending contact form email:', error);
    return false;
  }
};

/**
 * Send a notification email (for various app notifications)
 */
export const sendNotificationEmail = async (
  to: string,
  username: string,
  subject: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'notifications@witherco.org',
      to,
      subject: `Guard-shin: ${subject}`,
      text: `
Hello ${username},

${message}

${actionUrl ? `${actionText || 'Click here'}: ${actionUrl}` : ''}

Thanks,
The Guard-shin Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(to right, #7289DA, #5865F2); padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; background-color: #f9f9f9; }
    .footer { text-align: center; padding: 10px; font-size: 12px; color: #999; }
    .button { display: inline-block; background-color: #5865F2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${subject}</h1>
  </div>
  <div class="content">
    <p>Hello ${username},</p>
    <p>${message}</p>
    ${actionUrl ? `
    <p style="text-align: center; margin: 30px 0;">
      <a href="${actionUrl}" class="button">${actionText || 'Click Here'}</a>
    </p>
    ` : ''}
    <p>Thanks,<br>The Guard-shin Team</p>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Guard-shin. All rights reserved.</p>
  </div>
</body>
</html>
      `,
    };

    await sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
};