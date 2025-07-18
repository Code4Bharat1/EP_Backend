import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import Student from "../models/student.model.js";
import Otp from "../models/otp.model.js";

const otpStore = {};

const demoSignup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      fullName,
      emailAddress,
      mobileNumber,
      password,
      isDemo
    } = req.body;

    if (!firstName || !emailAddress || !mobileNumber || !password) {
      return res.status(400).json({ message: "First name, email, mobile number, and password are required." });
    }

    // Use Op.or properly here
    const existingStudent = await Student.findOne({
      where: {
        [Op.or]: [
          { emailAddress },
          { mobileNumber }
        ]
      }
    });

    if (existingStudent) {
      return res.status(409).json({ message: "A student with this email or mobile already exists." });
    }

    let demoExpiry = null;
    let isDemoUser = false;

    if (isDemo === true || isDemo === "true") {
      isDemoUser = true;
      demoExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const newStudent = await Student.create({
      firstName,
      lastName,
      fullName: fullName || `${firstName} ${lastName || ""}`.trim(),
      emailAddress,
      mobileNumber,
      password,
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



const sendOtp = async (req, res) => {
  try {
    Otp.sync({ alter: true }).then(() => console.log('Otp table synced.'));
    const { mobileNumber } = req.body;
    if (!mobileNumber || mobileNumber.length !== 10) {
      return res.status(400).json({ message: "Valid mobile number is required." });
    }

    const exists = await Student.findOne({ where: { mobileNumber } });
    if (exists) {
      return res.status(409).json({ message: "Mobile number already registered." });
    }

    // Generate and set OTP expiry (e.g. 5 min)
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Upsert: If OTP exists for this mobile, update it
    await Otp.upsert({ mobileNumber, otp, expiresAt });

    // Send OTP (integrate SMS API here)
    console.log(`(Demo) Sending OTP ${otp} to ${mobileNumber}`);

    return res.status(200).json({ message: "OTP sent successfully." });
  } catch (e) {
    console.error("Error in sendOtp:", e);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    if (!mobileNumber || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required." });
    }

    const record = await Otp.findOne({ where: { mobileNumber, otp } });
    if (!record) {
      return res.status(400).json({ message: "Invalid OTP." });
    }
    if (new Date() > new Date(record.expiresAt)) {
      return res.status(400).json({ message: "OTP expired." });
    }

    await Otp.destroy({ where: { mobileNumber } }); // Remove after use (optional, but good practice)
    return res.status(200).json({ message: "OTP verified. You may now sign up." });
  } catch (e) {
    console.error("Error in verifyOtp:", e);
    return res.status(500).json({ message: "Internal server error." });
  }
};


export { demoSignup, sendOtp , verifyOtp};