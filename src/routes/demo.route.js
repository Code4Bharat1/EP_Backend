import express from "express";
import {
  sendSignupOTP,
  verifySignupOTP,
  completeSignup,
} from "../controller/demo.controller.js";

const router = express.Router();

router.post("/signup/send-otp", sendSignupOTP);
router.post("/signup/verify-otp", verifySignupOTP);
router.post("/signup/complete", completeSignup);

export default router;
