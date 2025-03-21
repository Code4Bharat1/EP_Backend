import express from "express";
import {
  register,
  verifyOtp,
  login,
  resendOtp,
  forgotPassword,
  resetPassword,
  savePersonalData,
  getPersonalData,
} from "../controller/student.controller.js";
import { studentAuth } from "../middleware/studentAuth.js"; // Authentication middleware
import { otpRateLimiter } from "../middleware/rateLimiter.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

// Route to register a new student and send OTP
router.post("/register", register);

// Route to verify OTP
router.post("/verify-otp", verifyOtp);

// Route to resend OTP
router.post("/resend-otp", otpRateLimiter, resendOtp);

// Route for login (email + password)
router.post("/login", login); // Login route

// Forgot Password Route (doesn't require authentication)
router.post("/forgot-password", forgotPassword);

// Reset Password Route (doesn't require authentication before OTP verification)
router.post("/reset-password", resetPassword);

//router to sav personal data
router.post(
  "/adddata",studentAuth,
  upload.fields([
            { 
                name: "profileImage",
                maxCount: 1 
            },
  ]),
  savePersonalData
);

router.get("/getdata", studentAuth, getPersonalData);

export default router;
