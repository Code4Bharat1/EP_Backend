import express from "express";
import {deleteAdminById, getAdminList} from "../controller/superAdmin.controller.js";

const router = express.Router();

router.get("/getadminlist", getAdminList);
router.post("/deleteadmin", deleteAdminById)


export default router;