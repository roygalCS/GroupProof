const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load .env file before reading environment variables
dotenv.config();

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY && SENDGRID_API_KEY !== 'your_sendgrid_api_key_here') {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized with API key (length:', SENDGRID_API_KEY.length, ')');
} else {
  console.warn('⚠️ SendGrid API key not configured or invalid');
}

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@smartdeadlines.com';

/**
 * Generate a JWT token for invite links
 */
function generateInviteToken(payload) {
  const { taskId, email, expiresIn = '7d' } = payload;

  return jwt.sign(
    {
      taskId,
      email: email.toLowerCase(),
      type: 'invite'
    },
    JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Verify an invite token
 */
function verifyInviteToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== 'invite') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Send an invitation email
 */
async function sendInviteEmail({ to, taskTitle, stakeAmount, inviteLink, creatorEmail }) {
  const emailContent = generateEmailTemplate({
    taskTitle,
    stakeAmount,
    inviteLink,
    creatorEmail
  });

  // If SendGrid is not configured, log the email instead
  if (!SENDGRID_API_KEY || SENDGRID_API_KEY === 'your_sendgrid_api_key_here') {
    console.log('\n=== 📧 EMAIL (SendGrid not configured - logged to console) ===');
    console.log(`To: ${to}`);
    console.log(`From: ${FROM_EMAIL}`);
    console.log(`Subject: You've been invited to join: ${taskTitle}`);
    console.log(`\nBody:\n${emailContent.text}`);
    console.log('\nInvite Link:', inviteLink);
    console.log('\n⚠️  To send real emails:');
    console.log('   1. Get a SendGrid API key from https://sendgrid.com');
    console.log('   2. Add SENDGRID_API_KEY=your_key_here to backend/.env');
    console.log('   3. Restart the backend server');
    console.log('=======================================\n');
    return { success: true, message: 'Email logged (SendGrid not configured)', error: 'SendGrid not configured' };
  }

  const msg = {
    to,
    from: FROM_EMAIL,
    subject: `You've been invited to join: ${taskTitle}`,
    text: emailContent.text,
    html: emailContent.html,
  };

  try {
    const result = await sgMail.send(msg);
    console.log(`✅ Invitation email sent successfully to ${to}`);
    console.log(`   Status: ${result[0]?.statusCode || 'sent'}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email to', to, ':', error.message);
    if (error.response) {
      console.error('SendGrid API Error:', JSON.stringify(error.response.body, null, 2));
      console.error('Status Code:', error.response.statusCode);
    }
    // Return error details instead of throwing
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body 
    };
  }
}

/**
 * Generate email template
 */
function generateEmailTemplate({ taskTitle, stakeAmount, inviteLink, creatorEmail }) {
  const text = `
You've been invited to join a SmartDeadlines task!

Task: ${taskTitle}
Invited by: ${creatorEmail}
Stake Required: ${stakeAmount} USDC

SmartDeadlines is an on-chain accountability system for group tasks. By joining, you'll deposit ${stakeAmount} USDC into an escrow account. If the task is completed successfully and the majority votes YES, you'll get your money back. Otherwise, the funds go to charity.

Click the link below to join:
${inviteLink}

This link will expire in 7 days.

What happens next:
1. Connect your Solana wallet (Phantom or compatible wallet)
2. Approve the ${stakeAmount} USDC deposit
3. Wait for all members to join
4. Complete the task before the deadline
5. Vote on completion
6. Get your refund or support a good cause

Questions? Learn more at our website.

---
SmartDeadlines - On-Chain Accountability for Group Tasks
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white !important;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .steps {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 You've Been Invited!</h1>
    <p style="margin: 0; opacity: 0.9;">Join a SmartDeadlines Task</p>
  </div>

  <div class="content">
    <div class="info-box">
      <h2 style="margin-top: 0; color: #667eea;">Task Details</h2>
      <p><strong>Task:</strong> ${taskTitle}</p>
      <p><strong>Invited by:</strong> ${creatorEmail}</p>
      <p><strong>Stake Required:</strong> ${stakeAmount} USDC</p>
    </div>

    <p>
      SmartDeadlines is an on-chain accountability system for group tasks.
      By joining, you'll deposit <strong>${stakeAmount} USDC</strong> into a secure escrow account.
    </p>

    <p>
      <strong>The deal:</strong> If the task is completed successfully and the majority votes YES,
      you'll get your money back. Otherwise, the funds go to a designated charity.
    </p>

    <div style="text-align: center;">
      <a href="${inviteLink}" class="button">Join Task Now</a>
    </div>

    <p style="text-align: center; color: #666; font-size: 14px;">
      This link expires in 7 days
    </p>

    <div class="steps">
      <h3 style="margin-top: 0; color: #667eea;">What Happens Next</h3>
      <ol>
        <li>Connect your Solana wallet (Phantom or compatible)</li>
        <li>Approve the ${stakeAmount} USDC deposit</li>
        <li>Wait for all members to join</li>
        <li>Complete the task before the deadline</li>
        <li>Vote on completion</li>
        <li>Get your refund or support a good cause</li>
      </ol>
    </div>

    <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; font-size: 14px;">
      <strong>Note:</strong> Make sure you have a Solana wallet with enough USDC to cover the stake amount
      plus a small amount for transaction fees.
    </p>
  </div>

  <div class="footer">
    <p>SmartDeadlines - On-Chain Accountability for Group Tasks</p>
    <p>Powered by Solana Blockchain</p>
  </div>
</body>
</html>
  `.trim();

  return { text, html };
}

module.exports = {
  sendInviteEmail,
  generateInviteToken,
  verifyInviteToken
};
