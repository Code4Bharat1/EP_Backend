import express from "express";
import { pastTest } from "../controller/pasttest.controller.js";

const router = express.Router();

router.get("/pasttest", pastTest);

export default router;