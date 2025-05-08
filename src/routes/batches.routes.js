import express from "express";
import { jwtDecode } from "../utils/jwtDecode.js";
import { batchesInfo } from "../controller/batchesInfo.controller.js";

const router = express.Router();

router.get(
  "/batchesInfo",
  jwtDecode,
  batchesInfo
);

export default router;
