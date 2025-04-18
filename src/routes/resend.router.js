import express from 'express';
import { sendEmail } from '../service/nodeMailerConfig.js';

const router = express.Router();

// Define the /email route that uses sendEmail
router.post('/email', sendEmail);

export default router;
