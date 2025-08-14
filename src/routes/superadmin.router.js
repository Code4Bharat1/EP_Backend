import express from "express";
import {deleteAdminById, getAdminList , createAdmin, getStaffMember, getadmin, updateAdmin} from "../controller/superAdmin.controller.js";

const router = express.Router();

router.get("/getadminlist", getAdminList);
router.post("/createadmin",createAdmin)
router.post("/deleteadmin", deleteAdminById)
router.get("/getStaff",getStaffMember)
router.get("/getadmin/:adminId",getadmin)
router.put("/updateAdmin/:adminId",updateAdmin)


export default router;