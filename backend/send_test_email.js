const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');
const { generateEmailHtml } = require('./services/brevoEmailService');

async function testSmtp() {
  console.log('--- Testing Brevo SMTP Relay ---');
  const user = (process.env.BREVO_SMTP_USER || 'srikar.m@econz.net').replace(/^["']|["']$/g, '').trim();
  const pass = (process.env.BREVO_API_KEY || '').replace(/^["']|["']$/g, '').trim();
  const from = (process.env.BREVO_FROM_EMAIL || 'Econz <srikar.m@econz.net>').replace(/^["']|["']$/g, '').trim();

  console.log(`SMTP User: ${user}`);
  console.log(`From: ${from}`);
  console.log(`Password Present: ${Boolean(pass)}`);

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass
    }
  });

  const htmlContent = generateEmailHtml({
    badgeText: 'QUOTE: #ORD-7388',
    eventHeading: '✨ New Quote Created',
    eventSubtitle: 'Google Workspace Enterprise Plus & Support Services',
    recipientName: 'Amarjeet',
    introMessage: 'A new commercial quote <strong>#ORD-7388</strong> for <strong>Acme Global Technologies</strong> has been created in Econz Orbit by <strong>Amarjeet</strong>.',
    cardTitle: 'DEAL & QUOTE DETAILS',
    details: [
      { label: 'Quote Number', value: '#ORD-7388' },
      { label: 'Customer / Client', value: 'Acme Global Technologies' },
      { label: 'Created By', value: 'Amarjeet' },
      {
        label: 'Current Status',
        value: 'Sent for Signature',
        isBadge: true,
        badgeBg: 'rgba(14, 165, 233, 0.15)',
        badgeColor: '#0284c7'
      },
      { label: 'Contract Value', value: '₹1,25,000' },
      { label: 'Date', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
    ],
    primaryButtonText: 'Open Quote in Orbit',
    primaryButtonUrl: 'http://localhost:5173/quotes',
    secondaryButtonText: 'View Dashboard',
    secondaryButtonUrl: 'http://localhost:5173/dashboard'
  });

  const mailOptions = {
    from: from,
    to: 'amarjeet@trynocode.com',
    subject: 'New Quote Created - ORD-7388',
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email successfully sent via Brevo SMTP Relay!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('❌ SMTP Relay Error:', err);
  }
}

testSmtp().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
