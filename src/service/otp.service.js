// services/otpService.js
import crypto from "crypto";

// Simple in-memory store for dev/demo; use Redis for production
const otpStore = {};

/**
 * Generate and store OTP for a mobile number
 * @param {string} mobileNumber
 * @returns {string} otp
 */
export function generateAndStoreOtp(mobileNumber) {
  const otp = crypto.randomInt(100000, 999999).toString();
  otpStore[mobileNumber] = otp;

  // TODO: Integrate with actual SMS gateway here!
  console.log(`(DEMO) Sending OTP ${otp} to ${mobileNumber}`);

  return otp;
}

export function verifyOtp(mobileNumber, otp) {
  if (otpStore[mobileNumber] === otp) {
    delete otpStore[mobileNumber];
    return true;
  }
  return false;
}
export function clearOtp(mobileNumber) {
  delete otpStore[mobileNumber];
}
