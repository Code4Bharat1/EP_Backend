import express from "express";
import {
  batchesInfo,
  getBatches,
  batchesAndTestInfo,
  getStudentsByBatchId,
  getTestBasicInfo,
  testBatchesInfo,
  assignBatchesToTest,
} from "../controller/batchesInfo.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";
const router = express.Router();

router.get("/batchesInfo/:batchId", batchesInfo); // get test info by the test
router.get("/testInfo/:testId" , testBatchesInfo) // get batch info by the test
router.post("/:testId/assign-batches" , assignBatchesToTest) // assign batch to the test
router.get("/newadmin/batches", getBatches); // het batch details
router.post("/test-info", batchesAndTestInfo); // get test and batch info
router.post("/batch-students", getStudentsByBatchId); // get batch student info
router.post("/test-basic-info", getTestBasicInfo); // get batch info

export default router;
