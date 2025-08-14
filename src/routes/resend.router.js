import express from 'express';
import { sendemail } from '../controller/email.controller.js';

const router = express.Router();

// Define the /email route that uses sendEmail
router.post('/email',sendemail);

export default router;
