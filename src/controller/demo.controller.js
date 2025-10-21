import crypto from "crypto";
import jwt from "jsonwebtoken";
import Student from "../models/student.model.js";
import Otp from "../models/otp.model.js";
import config from "config";
import bcrypt from "bcrypt";
import { sendWhatsAppMessage } from "../utils/sendWhatsapp.js"; 

// ============================================================
// 🔹 Validate Email Format
// ============================================================
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/* ============================================================
   🔹 SEND SIGNUP OTP (WhatsApp ONLY - NO EMAIL)
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
    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

    // Save OTP to database
    await Otp.upsert({
      emailAddress,
      otp,
      expiresAt: otpExpiry,
      verified: false,
      purpose: "student_signup",
    });

    // ✅ SEND OTP ONLY VIA WHATSAPP - NO EMAIL
    const whatsappResult = await sendWhatsAppMessage(
      mobileNumber,
      `Your OTP for *Neet 720* signup is: *${otp}*

This OTP is valid for 5 minutes only.

Please use this code to complete your registration.

If you did not request this, please contact support immediately.

Thank you for using *Neet 720*!`
    );

    if (!whatsappResult) {
      return res.status(500).json({ message: "Failed to send OTP via WhatsApp." });
    }

    return res.status(200).json({
      message: "OTP sent successfully to your WhatsApp!",
      expiresIn: "5 minutes",
    });

  } catch (err) {
    console.error("❌ Error in sendSignupOTP:", err);
    return res.status(500).json({ message: "Failed to send OTP." });
  }
};

/* ============================================================
   🔹 RESEND OTP (WhatsApp ONLY - NO EMAIL)
============================================================ */
export const resendOtp = async (req, res) => {
  const { emailAddress, mobileNumber } = req.body;

  if (!emailAddress || !mobileNumber) {
    return res.status(400).json({ message: "Please provide both email and mobile number." });
  }

  try {
    // Check if an OTP already exists for this email and is not verified
    const existingOtp = await Otp.findOne({ where: { emailAddress, verified: false } });

    if (!existingOtp) {
      return res.status(400).json({ message: "No pending OTP found. Please request a new OTP." });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

    // Update OTP in database
    await Otp.update({ otp, expiresAt: otpExpiry }, { where: { emailAddress } });

    // ✅ SEND OTP ONLY VIA WHATSAPP - NO EMAIL
    const whatsappResult = await sendWhatsAppMessage(
      mobileNumber,
      `Your NEW OTP for *Neet 720* signup is: *${otp}*

This OTP is valid for 5 minutes only.

If you did not request this, please contact support.

Thank you for using *Neet 720*!`
    );

    if (!whatsappResult) {
      return res.status(500).json({ message: "Failed to resend OTP via WhatsApp." });
    }

    return res.status(200).json({
      message: "OTP resent successfully to your WhatsApp!",
      expiresIn: "5 minutes",
    });

  } catch (err) {
    console.error("❌ Error in resendOtp:", err);
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
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    // Mark OTP as verified
    await Otp.update({ verified: true }, { where: { emailAddress } });

    return res.status(200).json({ 
      message: "OTP verified successfully. You can now complete signup." 
    });
  } catch (error) {
    console.error("❌ Error in verifySignupOTP:", error);
    return res.status(500).json({ message: "Internal server error while verifying OTP." });
  }
};

/* ============================================================
   🔹 COMPLETE SIGNUP AFTER OTP VERIFICATION
============================================================ */
export const completeSignup = async (req, res) => {
  try {
    const { firstName, lastName, emailAddress, password, mobileNumber, isDemo } = req.body;

    if (!firstName || !emailAddress || !password || !mobileNumber) {
      return res.status(400).json({ 
        message: "First name, email, password, and mobile number are required." 
      });
    }

    // Verify OTP was confirmed
    const otpRecord = await Otp.findOne({
      where: { emailAddress, verified: true, purpose: "student_signup" },
    });

    if (!otpRecord) {
      return res.status(403).json({ 
        message: "OTP not verified. Please verify OTP before signup." 
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ where: { emailAddress } });
    if (existingStudent) {
      return res.status(409).json({ message: "Student with this email already exists." });
    }

    // Handle demo user
    let demoExpiry = null;
    let isDemoUser = false;

    if (isDemo === true || isDemo === "true") {
      isDemoUser = true;
      demoExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new student
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

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || config.get("jwtSecret") || "your-secret-key";

    const tokenPayload = {
      id: newStudent.id,
      email: newStudent.emailAddress,
      isDemo: isDemoUser,
    };
    if (isDemoUser && demoExpiry) tokenPayload.demoExpiry = demoExpiry;

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "30d" });

    // Clean up OTP record
    await Otp.destroy({ where: { emailAddress } });

    // Remove password from response
    const cleanStudent = { ...newStudent.get() };
    delete cleanStudent.password;

    return res.status(201).json({
      message: "Student account created successfully.",
      user: cleanStudent,
      token,
    });
  } catch (error) {
    console.error("❌ Error in completeSignup:", error);
    return res.status(500).json({ message: "Internal server error during signup." });
  }
};