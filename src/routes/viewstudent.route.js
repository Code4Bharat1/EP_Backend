import express from "express"
import getStudentInfo, { bulkSaveStudents, createBatch, getBatchInfo, updateBatchIdForUsers } from "../controller/viewstudent.controller.js";
import { saveBasicStudentData } from "../controller/viewstudent.controller.js";
import { deleteBatch } from "../controller/admin.controller.js";

const router = express.Router();

router.get("/info", getStudentInfo);
router.post("/save", saveBasicStudentData);
router.post("/bulk-save", bulkSaveStudents);
router.post("/update", updateBatchIdForUsers);
router.post("/batch", createBatch);
router.get("/getbatch", getBatchInfo);
router.get("/batches/:batchId", deleteBatch);

export default router;