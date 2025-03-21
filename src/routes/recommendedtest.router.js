import express from "express";
import { CreateEntry, getAllDataFromSchema, GetRecoTestByid } from "../controller/recommendedtest.controller.js";
import { studentAuth } from "../middleware/studentAuth.js";

const router = express.Router();

router.get("/alldatahere", getAllDataFromSchema);

router.post("/give_test", studentAuth, CreateEntry);

router.get("/getbyid", studentAuth, GetRecoTestByid);

export default router;
