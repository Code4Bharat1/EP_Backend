import express from "express"
import getStudentInfo, { bulkSaveStudents,getBatchNames, createBatch, getBatchInfo, updateBatchIdForUsers , deleteStudentById } from "../controller/viewstudent.controller.js";
import { saveBasicStudentData } from "../controller/viewstudent.controller.js";
import { deleteBatch } from "../controller/admin.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";

const router = express.Router();

router.post("/info", getStudentInfo);
router.post("/save", saveBasicStudentData);
router.post("/bulk-save", bulkSaveStudents);
router.post("/update", updateBatchIdForUsers);
router.post("/batch",verifyToken, createBatch);
router.get("/getbatch",verifyToken, getBatchInfo);
router.get("/batches/:batchId", deleteBatch);
router.post("/batchnames", getBatchNames)
router.delete("/delete", deleteStudentById);

export default router;  