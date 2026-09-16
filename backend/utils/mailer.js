const nodemailer = require('nodemailer');

const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
let transporter;

const getTransporter = () => {
  if (!smtpConfigured()) return null;
  if (!transporter) transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_PORT) === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

const sendMail = async ({ to, subject, html }) => {
  try {
    const activeTransport = getTransporter();
    if (!activeTransport) {
      if (process.env.NODE_ENV !== 'production') {
        console.info(`Development email for ${to}: ${subject}\n${html}`);
        return true;
      }
      console.error('Mail is not configured: SMTP_HOST is required in production.');
      return false;
    }
    await activeTransport.sendMail({
      from: process.env.SMTP_FROM || '"Delta Squad" <noreply@deltasquad.app>',
      to, subject, html,
    });
    return true;
  } catch (error) {
    console.error('Mail Error:', error);
    return false;
  }
};

module.exports = sendMail;
module.exports.smtpConfigured = smtpConfigured;
