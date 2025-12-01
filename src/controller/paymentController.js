import Razorpay from "razorpay";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";                    // ✅ ADD bcrypt
import Student from "../models/student.model.js";
import hashPassword from "../utils/hasshedPassowrd.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ---------- CREATE ORDER (Fixed for existing students) ----------
export const createOrder = async (req, res) => {
  try {
    const { name, email, phone, planType } = req.body;  // ✅ Removed password requirement

    if (!name || !email || !phone || !planType) {
      return res.status(400).json({ message: "Missing required fields: name, email, phone, planType" });
    }

    const amount = planType === "year" ? 50000 : 5000; // ₹500 / ₹50

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `upgrade_${Date.now()}`,
      notes: { email, plan: planType },
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

// ---------- VERIFY PAYMENT (Fixed) ----------
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      signupData,
      skipSig,
    } = req.body;

    console.log("🔍 verifyPayment:", signupData?.email);  // ✅ Debug

    if (!signupData?.email) {
      return res.status(400).json({ message: "signupData.email required" });
    }

    // Skip signature for testing
    if (!skipSig) {
      const valid = verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        process.env.RAZORPAY_KEY_SECRET
      );
      if (!valid) return res.status(400).json({ message: "Invalid signature" });
    }

    // ✅ Find existing student
    const student = await Student.findOne({ 
      where: { emailAddress: signupData.email } 
    });
    
    console.log("🔍 Student:", student?.id);  // ✅ Debug
    
    if (!student) {
      return res.status(404).json({ 
        message: `Student not found: ${signupData.email}` 
      });
    }

    // Hash password ONLY if provided
    let hashedPassword = student.password;
    if (signupData.password) {
      hashedPassword = await bcrypt.hash(signupData.password, 10);
    }

    const now = new Date();
    const subscriptionEnd = signupData.planType === "year"
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // ✅ Upgrade student
    await student.update({
      fullName: signupData.name || student.fullName,
      mobileNumber: signupData.phone || student.mobileNumber,
      password: hashedPassword,
      paymentVerified: true,
      subscriptionType: signupData.planType,
      subscriptionStart: now,
      subscriptionEnd,
      freeUsageCount: 0,
    });

    const token = jwt.sign(
      { id: student.id, email: student.emailAddress },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    console.log("✅ UPGRADED student:", student.id);

    return res.status(200).json({
      token,
      message: "Subscription activated! Unlimited access granted.",
      studentId: student.id,
    });
  } catch (err) {
    console.error("verifyPayment ERROR:", err);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

const verifySignature = (orderId, paymentId, signature, keySecret) => {
  const hmac = crypto.createHmac("sha256", keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest("hex") === signature;
};
