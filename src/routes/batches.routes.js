import express from "express";
import { batchesInfo, getBatches } from "../controller/batchesInfo.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";
const router = express.Router();

router.get(
  "/batchesInfo",
  batchesInfo
);
router.get("/newadmin/batches", getBatches);


export default router;
