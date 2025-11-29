import express from "express";
import { Op } from "sequelize";
import {
  register,
  verifyOtp,
  login,
  resendOtp,
  forgotPassword,
  resetPassword,
  savePersonalData,
  getPersonalData,
  newSavePersonalData,
  deleteStudentAccount,
} from "../controller/student.controller.js";
import { studentAuth } from "../middleware/studentAuth.js"; // Authentication middleware
import { otpRateLimiter } from "../middleware/rateLimiter.js";
import { upload } from "../middleware/multer.middleware.js";




const router = express.Router();



import { googleLogin } from "../controller/student.controller.js";



// Existing routes...
// router.post("/login", login);

router.post("/google-login", googleLogin);



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

router.post("/newdata", newSavePersonalData);

router.get("/getdata", studentAuth, getPersonalData);

// Route for student to delete their own account
router.delete("/delete-account", studentAuth, deleteStudentAccount);

// console.log("✅ student.router.js loaded");


export default router;
