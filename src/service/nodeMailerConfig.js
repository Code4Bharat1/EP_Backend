// middelewere/nodemailerConfig.js
import nodemailer from 'nodemailer';
import config from 'config';

// Retrieve mail credentials from config
const mailAuth = config.get('mailAuth');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or "hotmail", "yahoo", etc., depending on your provider
  auth: {
    user: mailAuth.user,
    pass: mailAuth.pass
  }
});

// Reusable function for sending emails
export const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: mailAuth.user, // Sender address
      to,                  // List of receivers
      subject,             // Subject line
      text,                // Plain text body
      html                 // HTML body (optional)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
