// routes/uploadRouter.js
import express from "express";
import multer from "multer";
import { handleS3Upload } from "../controller/awsUploadController.controller.js";

const router = express.Router();

// Use multer to parse file from multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define route and bind controller
router.post("/upload", upload.single("file"), handleS3Upload);

export default router;
