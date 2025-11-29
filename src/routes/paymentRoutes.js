import express from "express";
import { createOrder, verifyPayment } from "../controller/paymentController.js";

const router = express.Router();

// POST /api/payment/public/create-order
// router.post("/public/create-order", createOrder);
// router.post("/public/verify-payment", verifyPayment);
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment)
export default router;
