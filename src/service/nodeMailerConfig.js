import nodemailer from 'nodemailer';
import config from 'config';

const { user, pass } = config.get('mailAuth');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
});

export async function sendEmail({ to, subject, text, html }) {
  if (!to || !subject || (!text && !html)) {
    throw new Error('sendEmail missing required arguments');
  }

  const mailOptions = {
    from: user,
    to,
    subject,
    text,
    html,
  };

  // this will throw if something goes wrong
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.response);
  return info;
}
