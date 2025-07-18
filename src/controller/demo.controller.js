import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import Student from "../models/student.model.js";
import Otp from "../models/otp.model.js";
import nodemailer from "nodemailer";
import config from "config";
import bcrypt from "bcrypt";


// --- Nodemailer setup ---
const mailAuth = config.get('mailAuth');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mailAuth?.user,
    pass: mailAuth?.pass,
  },
});

// --- Send OTP to Email ---
const sendOtp = async (req, res) => {
  try {
    Otp.sync({ alter: true }).then(() => console.log('Otp table synced.'));
    const { emailAddress } = req.body;
    if (!emailAddress) {
      return res.status(400).json({ message: "Valid email address is required." });
    }

    const exists = await Student.findOne({ where: { emailAddress } });
    if (exists) {
      return res.status(409).json({ message: "Email already registered." });
    }

    // Generate and set OTP expiry (e.g. 5 min)
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Upsert: If OTP exists for this email, update it
    await Otp.upsert({ emailAddress, otp, expiresAt });

    // Send OTP via email
    const mailOptions = {
      from: mailAuth.user,
      to: emailAddress,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}\nThis code is valid for 5 minutes.`,
    };
    await transporter.sendMail(mailOptions);

    // For dev: also return OTP in response (remove in production)
    return res.status(200).json({ message: "OTP sent to your email address.", demoOtp: otp });
  } catch (e) {
    console.error("Error in sendOtp:", e);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { emailAddress, otp } = req.body;
    if (!emailAddress || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const record = await Otp.findOne({ where: { emailAddress, otp } });
    if (!record) {
      return res.status(400).json({ message: "Invalid OTP." });
    }
    if (new Date() > new Date(record.expiresAt)) {
      return res.status(400).json({ message: "OTP expired." });
    }

    await Otp.destroy({ where: { emailAddress } });
    return res.status(200).json({ message: "OTP verified. You may now sign up." });
  } catch (e) {
    console.error("Error in verifyOtp:", e);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const demoSignup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      fullName,
      emailAddress,
      password,
      isDemo
    } = req.body;

    if (!firstName || !emailAddress || !password) {
      return res.status(400).json({ message: "First name, email, and password are required." });
    }

    const existingStudent = await Student.findOne({
      where: { emailAddress }
    });

    if (existingStudent) {
      return res.status(409).json({ message: "A student with this email already exists." });
    }

    let demoExpiry = null;
    let isDemoUser = false;

    if (isDemo === true || isDemo === "true") {
      isDemoUser = true;
      demoExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await Student.create({
      firstName,
      lastName,
      fullName: fullName || `${firstName} ${lastName || ""}`.trim(),
      emailAddress,
      password: hashedPassword,   // Store the hashed password
      isVerified: false,
      demoExpiry,
      isDemo: isDemoUser
    });
    await Student.sync({ alter: true });

    const token = jwt.sign(
      { userId: newStudent.id, emailAddress: newStudent.emailAddress },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    const cleanStudent = { ...newStudent.get() };
    delete cleanStudent.password;

    return res.status(201).json({
      message: isDemoUser
        ? "Demo student account created successfully. Demo valid for 7 days."
        : "Student account created successfully.",
      user: cleanStudent,
      token
    });

  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export { demoSignup, sendOtp, verifyOtp };