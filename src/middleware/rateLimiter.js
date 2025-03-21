// File: middleware/rateLimiter.js

import rateLimit from 'express-rate-limit';

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: 'Too many OTP requests from this IP, please try again after 15 minutes',
});
