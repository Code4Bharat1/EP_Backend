import express from "express";
import getStudentInfo, {
  bulkSaveStudents,
  getBatchNames,
  createBatch,
  getBatchInfo,
  updateBatchIdForUsers,
  deleteStudentById,
  updateBatch,
  getStudentInfoByBatch,
} from "../controller/viewstudent.controller.js";
import { saveBasicStudentData } from "../controller/viewstudent.controller.js";
import { deleteBatch } from "../controller/admin.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";

const router = express.Router();

router.post("/info", getStudentInfo); // get student info by ID
router.post("/batch-student", getStudentInfoByBatch); // get student info by batch ID
router.post("/save", saveBasicStudentData);
router.post("/bulk-save", bulkSaveStudents);
router.post("/update", updateBatchIdForUsers);
router.post("/batch", verifyToken, createBatch); // create batches
// PUT /api/batch/:batchId
router.put("/batch/:batchId", verifyToken, updateBatch);
// DELETE /api/batch/:batchId
router.delete("/batch/:batchId", verifyToken, deleteBatch);
router.get("/getbatch", verifyToken, getBatchInfo); // get batch info
router.get("/batches/:batchId", deleteBatch); // delete batch by ID
router.post("/batchnames", getBatchNames);
router.delete("/delete", deleteStudentById);

export default router;
