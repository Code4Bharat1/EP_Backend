import express from "express";

import { createTest,getChapters,getQuestionsByTopic,getTestDetails,createdTests } from '../controller/admintest.controller.js';


const router = express.Router();

router.post('/createtest',createTest);


//http://localhost:3306/api/admintest/getchapters?subject=chemistry
router.get('/getchapters',getChapters);




//http://localhost:3306/api/admintest/getquestions?topic_tags=Physics and Measurement

router.get('/getquestions', getQuestionsByTopic);



router.get('/gettestdetails', getTestDetails);


router.get('/createdtests',createdTests);



export default router;
