// admin.router.js

import express from "express";


import {createAdmin,login,viewBatch,getBatchListbyId, generateCredential,getApprovedList,getList,addStudent,studentsList,viewStudent,deleteStudents,bulkStudentUpload ,editBatch ,addBatch,getAllBatch,deleteBatch, getBatchNames} from  '../controller/admin.controller.js';


const router = express.Router();


router.post('/createadmin', createAdmin);


router.post("/generate", generateCredential);


router.post('/login',login);


router.get("/getlist", getList);


router.get("/getApprovedList", getApprovedList);


router.post("/addstudent",addStudent );


router.get("/getstudentslist",studentsList);


router.get("/getstudent/:id",viewStudent);


router.delete("/delete/:id",deleteStudents);


router.post("/bulkupload",bulkStudentUpload);


router.post("/addbatch", addBatch);


router.get("/viewBatch/:batchId",viewBatch);


router.put("/editbatch/:batchId",editBatch);


router.get("/getallbatch",getAllBatch);


router.delete("/deletebatch/:batchId",deleteBatch);


router.get("/getBatchListbyId",getBatchListbyId);

router.post('/batchesInfobyId', getBatchNames);



export default router;