import nodemailer from 'nodemailer';
import config from 'config';

// Retrieve mail credentials from config
const mailAuth = config.get('mailAuth');



// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or "hotmail", "yahoo", etc., depending on your provider
  auth: {
    user: mailAuth?.user,
    pass: mailAuth?.pass,
  },
});


// Reusable function for sending emails
export const sendEmail = async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    // Validate the request data
    if (!to || !subject || !text) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const mailOptions = {
      from: mailAuth.user, // Sender address
      to,                  // List of receivers
      subject,             // Subject line
      text,                // Plain text body
    };

    // Attempt to send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return res.status(200).json(info);
  } catch (error) {
    // Log detailed error to console for debugging
    console.error('Error sending email:', error);

    // Send a more descriptive error message to the client
    return res.status(500).json({
      message: 'Internal Server Error - Email failed to send',
      error: error.message, // Return the error message for debugging
    });
  }
};
