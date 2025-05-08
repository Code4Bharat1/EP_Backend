import express from "express";
import { batchesInfo } from "../controller/batchesInfo.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";
const router = express.Router();

router.get(
  "/batchesInfo",
  batchesInfo
);

export default router;
