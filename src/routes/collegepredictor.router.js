import express from "express";
import {
  predictColleges,
  getStates,
  getCourses,
  getCategories,
} from "../controller/collegepredictor.js";

const router = express.Router();

router.post("/predict-college", predictColleges);
router.get("/states", getStates);
router.get("/courses", getCourses); // Requires ?state=StateName
router.get("/categories", getCategories);

export default router;
