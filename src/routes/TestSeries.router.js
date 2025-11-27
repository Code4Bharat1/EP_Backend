import express from "express";
import {
  addQuestions,
  createTest,
  createTestResult,
  createTestSeries,
  deleteQuestions,
  editQuestions,
  getAllTestSeries,
  getTestsBySeriesId,
  getTestSeriesDetails,
  getTestSeriesQuestionsByTestId,
  getTestSeriesTestDetails,
} from "../controller/TestSeries.controller.js";
import { verifyToken } from "../middleware/jwtDecoder.middleware.js";

const router = express.Router();

// test series route
router.post("/create-test-series", verifyToken, createTestSeries); // create test series
router.get("/",verifyToken, getAllTestSeries); // get all test series
router.get("/:id",verifyToken, getTestSeriesDetails); // get specific test series data

//test series test
router.post("/create-test-series/test", verifyToken, createTest);
router.get("/test-series-test/:seriesId/tests", getTestsBySeriesId);
router.get("/test-series-test/:testId", getTestSeriesTestDetails);

//test series questions 
router.post("/question/create", addQuestions);
router.get("/test-series-question/:testId", getTestSeriesQuestionsByTestId);//student 
router.put("/question/edit" , editQuestions)
router.delete("/question/delete" , deleteQuestions)

// test result 
router.post("/test-result", createTestResult) 


export default router;
