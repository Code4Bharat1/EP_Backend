import express from "express";
import {deleteAdminById, getAdminList , createAdmin, getStaffMember, getadmin, updateAdmin, superAdminLogin} from "../controller/superAdmin.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";
import { verify } from "crypto";
const router = express.Router();

router.post("/login",superAdminLogin)
router.get("/getadminlist" , getAdminList);
router.post("/createadmin" , createAdmin)
router.post("/deleteadmin" , deleteAdminById)
router.get("/getStaff" , getStaffMember)
router.get("/getadmin/:adminId" ,getadmin)
router.put("/updateAdmin/:adminId" ,updateAdmin)


export default router;