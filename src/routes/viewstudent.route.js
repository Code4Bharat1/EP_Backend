import express from "express";
import getStudentInfo, {
  bulkSaveStudents,
  getBatchNames,
  createBatch,
  getBatchInfo,
  updateBatchIdForUsers,
  deleteStudentById,
  updateBatch,
  getBatchById,
  getStudentInfoByBatch,
  updateStudentData
} from "../controller/viewstudent.controller.js";
import { saveBasicStudentData } from "../controller/viewstudent.controller.js";
import { deleteBatch } from "../controller/admin.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";

const router = express.Router();

router.post("/info", getStudentInfo); // get student info by ID
router.post("/batch-student", getStudentInfoByBatch); // get student info by batch ID
router.get("/batch/:batchId", verifyToken, getBatchById); // get batch by ID
router.post("/save", saveBasicStudentData);
router.post("/bulk-save", bulkSaveStudents);
router.put("/update", updateStudentData); // Fixed: use PUT for updates and proper function
router.post("/batch-update", updateBatchIdForUsers); // Renamed to avoid conflict
router.post("/batch", verifyToken, createBatch); // create batches
router.put("/batch/:batchId", verifyToken, updateBatch); // PUT /api/batch/:batchId
router.delete("/batch/:batchId", verifyToken, deleteBatch); // DELETE /api/batch/:batchId
router.delete("/delete", deleteStudentById); // delete student by ID
router.get("/batch-names", getBatchNames); // get batch names
router.get("/batch-info", verifyToken, getBatchInfo); // get batch info
router.post("/batchnames", getBatchNames); // alternative endpoint for batch names

export default router;
