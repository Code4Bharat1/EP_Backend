import express from "express"
import createNotice, { deleteNotice, getNoticesByAdmin, getStudentNotices, updateNotice } from "../controller/notice.controller.js";

const router = express.Router();

router.post("/add-notice", createNotice);
router.post("/update-notice", updateNotice);
router.post("/fetch-notice", getNoticesByAdmin);
router.post("/notice-for-students", getStudentNotices);
router.post("/delete-notice", deleteNotice);

export default router;