import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import Student from "../models/student.model.js";
import Otp from "../models/otp.model.js";
import nodemailer from "nodemailer";
import config from "config";
import bcrypt from "bcrypt";
import { sendWhatsAppMessage } from "../utils/sendWhatsapp.js"; 

// --- Email Setup ---
const mailAuth = config.get("mailAuth");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mailAuth?.user,
    pass: mailAuth?.pass,
  },
});

// ============================================================
// 🔹 Validate Email Format
// ============================================================
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
/* ============================================================
   🔹 SEND SIGNUP OTP (Email + WhatsApp)
============================================================ */
export const sendSignupOTP = async (req, res) => {
  const { emailAddress, mobileNumber } = req.body;

  if (!emailAddress || !mobileNumber) {
    return res.status(400).json({ message: "Please enter both email and mobile number." });
  }

  if (!validateEmail(emailAddress)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  if (!/^\d{10}$/.test(mobileNumber)) {
    return res.status(400).json({ message: "Enter a valid 10-digit mobile number." });
  }

  try {
    // Generate OTP and send it
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

    // Create a new OTP record or update if already exists
    await Otp.upsert({
      emailAddress,
      otp,
      expiresAt: otpExpiry,
      verified: false,
      purpose: "student_signup",
    });

    // Send OTP via WhatsApp and Email
    const sendTasks = [
  sendWhatsAppMessage(mobileNumber, `
    Your OTP for *Neet 720* signup is: ${otp}.
    It is valid for the next 5 minutes.
    Please use this code to complete your registration process.
    If you did not initiate this request, please contact our support team immediately for assistance.
    Thank you for using *Neet 720*.
  `),

  transporter.sendMail({
    from: `"Neet720" <${mailAuth.user}>`,
    to: emailAddress,
    subject: "Your OTP Code for Neet 720 Signup",
    text: `
      Dear User,

      Your OTP for *Neet 720* signup is: ${otp}.
      This OTP is valid for the next 5 minutes, so please use it promptly to complete your registration.

      If you did not request this OTP, please get in touch with our support team right away to ensure the security of your account.

      Thank you for using *Neet 720*.

      Best Regards,
      Neet 720 Support Team
    `,
  }),
];


    await Promise.all(sendTasks);

    return res.status(200).json({
      message: "OTP sent successfully to your Email & WhatsApp!",
      expiresIn: "5 minutes",
    });

  } catch (err) {
    console.error("Error in sendSignupOTP:", err);
    return res.status(500).json({ message: "Failed to send OTP." });
  }
};

/* ============================================================
   🔹 RESEND OTP (Email + WhatsApp)
============================================================ */
export const resendOtp = async (req, res) => {
  const { emailAddress, mobileNumber } = req.body;

  if (!emailAddress || !mobileNumber) {
    return res.status(400).json({ message: "Please provide both email and mobile number." });
  }

  try {
    // Check if an OTP already exists for this email and is not verified
    const existingOtp = await Otp.findOne({ where: { emailAddress, verified: false } });

    // If OTP exists and is expired, resend a new OTP
    if (existingOtp && new Date(existingOtp.expiresAt) < new Date()) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

      await Otp.update({ otp, expiresAt: otpExpiry }, { where: { emailAddress } });

      // Send OTP via WhatsApp and email again
      const sendTasks = [
        sendWhatsAppMessage(mobileNumber, `Your OTP for signup is: ${otp}. Valid for 5 minutes.`),
        transporter.sendMail({
          from: `"Neet720" <${mailAuth.user}>`,
          to: emailAddress,
          subject: "Your Resent OTP Code",
          text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
        }),
      ];

      await Promise.all(sendTasks);

      return res.status(200).json({
        message: "OTP resent successfully to your Email & WhatsApp!",
        expiresIn: "5 minutes",
      });
    }

    return res.status(400).json({ message: "No valid OTP found to resend." });

  } catch (err) {
    console.error("Error in resendOtp:", err);
    return res.status(500).json({ message: "Failed to resend OTP." });
  }
};

/* ============================================================
   🔹 VERIFY SIGNUP OTP
============================================================ */
export const verifySignupOTP = async (req, res) => {
  try {
    const { emailAddress, otp } = req.body;

    if (!emailAddress || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const record = await Otp.findOne({
      where: { emailAddress, otp, purpose: "student_signup" },
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (new Date() > new Date(record.expiresAt)) {
      return res.status(400).json({ message: "OTP expired." });
    }

    await Otp.update({ verified: true }, { where: { emailAddress } });

    return res.status(200).json({ message: "OTP verified successfully. You can now complete signup." });
  } catch (error) {
    console.error("Error in verifySignupOTP:", error);
    return res.status(500).json({ message: "Internal server error while verifying OTP." });
  }
};

/* ============================================================
   🔹 COMPLETE SIGNUP AFTER OTP VERIFICATION
============================================================ */
export const completeSignup = async (req, res) => {
  try {
    const { firstName, lastName, emailAddress, password, mobileNumber, isDemo } = req.body;

    if (!firstName || !emailAddress || !password) {
      return res.status(400).json({ message: "First name, email, and password are required." });
    }

    const otpRecord = await Otp.findOne({
      where: { emailAddress, verified: true, purpose: "student_signup" },
    });

    if (!otpRecord) {
      return res.status(403).json({ message: "OTP not verified. Please verify OTP before signup." });
    }

    const existingStudent = await Student.findOne({ where: { emailAddress } });
    if (existingStudent) {
      return res.status(409).json({ message: "Student with this email already exists." });
    }

    let demoExpiry = null;
    let isDemoUser = false;

    if (isDemo === true || isDemo === "true") {
      isDemoUser = true;
      demoExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await Student.create({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName || ""}`.trim(),
      emailAddress,
      mobileNumber,
      password: hashedPassword,
      isVerified: true,
      demoExpiry: demoExpiry ? new Date(demoExpiry) : null,
      isDemo: isDemoUser,
    });

    const JWT_SECRET = process.env.JWT_SECRET || config.get("jwtSecret") || "your-secret-key";

    const tokenPayload = {
      id: newStudent.id,
      email: newStudent.emailAddress,
      isDemo: isDemoUser,
    };
    if (isDemoUser && demoExpiry) tokenPayload.demoExpiry = demoExpiry;

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

    await Otp.destroy({ where: { emailAddress } });

    const cleanStudent = { ...newStudent.get() };
    delete cleanStudent.password;

    return res.status(201).json({
      message: "Student account created successfully.",
      user: cleanStudent,
      token,
    });
  } catch (error) {
    console.error("Error in completeSignup:", error);
    return res.status(500).json({ message: "Internal server error during signup." });
  }
};
