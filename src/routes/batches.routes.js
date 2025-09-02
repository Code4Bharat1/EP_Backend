import express from "express";
import {
  batchesInfo,
  getBatches,
  batchesAndTestInfo,
  getStudentsByBatchId,
  getTestBasicInfo,
} from "../controller/batchesInfo.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";
const router = express.Router();

router.get("/batchesInfo", batchesInfo);
router.get("/newadmin/batches", getBatches);
router.post("/test-info", batchesAndTestInfo);
router.post("/batch-students", getStudentsByBatchId);
router.post("/test-basic-info", getTestBasicInfo);

export default router;
