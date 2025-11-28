import Razorpay from "razorpay";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Student from "../models/student.model.js";
import hashPassword from "../utils/hasshedPassowrd.js"; // make sure file name is correct

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ---------- CREATE ORDER (Step 1.1) ----------
export const createOrder = async (req, res) => {
  try {
    const { name, email, phone, password, planType } = req.body;

    if (!name || !email || !phone || !password || !planType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const amount = planType === "year" ? 50000 : 5000; // paise (₹500 / ₹50 etc.)

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `signup_${Date.now()}`,
      notes: { signup_email: email, plan: planType },
    });

    return res.status(200).json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name,
      email,
      phone,
      planType,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ message: "Failed to create order" });
  }
};

// ---------- SIGNATURE HELPER ----------
const verifySignature = (orderId, paymentId, signature, keySecret) => {
  const hmac = crypto.createHmac("sha256", keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  const digest = hmac.digest("hex");
  return digest === signature;
};

// ---------- VERIFY PAYMENT + CREATE STUDENT (Step 1.5) ----------
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      signupData,
      skipSig, // for Postman testing only
    } = req.body;

    // For real Razorpay flow, skipSig will be undefined/false
    if (!skipSig) {
      const valid = verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        process.env.RAZORPAY_KEY_SECRET
      );

      if (!valid) {
        return res.status(400).json({ message: "Invalid signature" });
      }
    }

    // hash password
    const hashedPassword = await hashPassword(signupData.password);

    const now = new Date();
    const subscriptionEnd =
      signupData.planType === "year"
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // IMPORTANT: match your Sequelize fields (emailAddress, mobileNumber, etc.)
    const student = await Student.create({
      fullName: signupData.name,
      emailAddress: signupData.email,
      mobileNumber: signupData.phone,
      password: hashedPassword,
      addedByAdminId: null,          // public student
      paymentVerified: true,
      subscriptionType: signupData.planType,
      subscriptionStart: now,
      subscriptionEnd,
    });

    const token = jwt.sign(
      { id: student.id, email: student.emailAddress },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    return res.status(200).json({
      token,
      message: "Signup & payment successful",
      studentId: student.id,
    });
  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};
