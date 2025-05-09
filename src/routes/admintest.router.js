import express from "express";

import { createTest,getChapters,getQuestionsByTopic,getTestDetails,createdTests, getTestCountByAdmin } from '../controller/admintest.controller.js';

import { verifyToken } from '../middleware/jwtDecoder.middleware.js';

const router = express.Router();

router.post('/createtest',createTest);


//http://localhost:3306/api/admintest/getchapters?subject=chemistry
router.get('/getchapters',getChapters);




//http://localhost:3306/api/admintest/getquestions?topic_tags=Physics and Measurement

router.get('/getquestions', getQuestionsByTopic);



router.get('/gettestdetails', getTestDetails);


router.get('/createdtests',createdTests);

router.get('/getTestCount', verifyToken,getTestCountByAdmin);


export default router;
