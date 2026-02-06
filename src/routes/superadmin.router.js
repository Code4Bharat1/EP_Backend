// superadmin.router.js

import express from "express";
import {deleteAdminById, getAdminList , createAdmin, getStaffMember, getadmin, updateAdmin, superAdminLogin} from "../controller/superAdmin.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";
import { canManageStaff } from "../middleware/roleAuth.js";
import uploadAdminLogo from "../middleware/adminLogoUpload.js";
const router = express.Router();

router.post("/login", superAdminLogin);
router.get("/getadminlist", getAdminList);

router.post(
  "/createadmin",
  canManageStaff,
  uploadAdminLogo.single("logo"),
  createAdmin
);

router.post("/deleteadmin", canManageStaff, deleteAdminById);
router.get("/getStaff", canManageStaff, getStaffMember);
router.get("/getadmin/:adminId", canManageStaff, getadmin);
router.put("/updateAdmin/:adminId", canManageStaff, updateAdmin);

export default router;