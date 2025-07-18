import express from 'express';
import config from 'config';
import studentRoutes from './src/routes/student.router.js';
import recotest from './src/routes/recommendedtest.router.js';
import questionRout from './src/routes/question.router.js';
import meTest from './src/routes/metest.route.js';
import { logger } from './src/middleware/logger.js';
import startrecotestRoute from './src/routes/startrecotest.route.js'
import cors from 'cors';
import airPredictorRoutes from './src/routes/airPredictor.router.js'
import adminRoutes from './src/routes/admin.router.js'
import Admintest from './src/routes/admintest.router.js'
import FullTestRoute from './src/routes/fulltestresult.route.js'
import createtestRoute from './src/routes/createtest.route.js'
import pasttestRoute from './src/routes/pasttest.route.js'
import dashboardRoute from './src/routes/dashboard.route.js'
import studentviewRoute from './src/routes/viewstudent.route.js'
import admingenerateRoute from './src/routes/admingenerate.route.js'
import newAdminRoute from './src/routes/newadmin.router.js'
import dsb from './src/routes/topperperformance.router.js'
import studentslogged from './src/routes/studentlogout.router.js'
import testresult from './src/routes/testresult.router.js';
import spotlight from './src/routes/spotlight.router.js';
import loginattendance from './src/routes/loginattendance.router.js'
import practice from './src/routes/practice.router.js';
import customize from './src/routes/customize.router.js'
import userprofile from './src/routes/user.router.js'
import sendEmailrouter from './src/routes/resend.router.js'
import superAdminRouter from './src/routes/superadmin.router.js'
import batchRouter from './src/routes/batches.routes.js'
import reviewQuestion from './src/routes/reviewquestion.route.js'
import fastquizquestion from './src/routes/fastquiz.router.js'
import noticeRouter from './src/routes/notice.router.js'
import omrRouter from './src/routes/omr.router.js'
import questionInsertionRouter from './src/routes/questionInsertion.route.js'
import uploadImageRouter from './src/routes/ImageUpload.router.js'
import PreviousYearQuestionRouter from './src/routes/pyq.router.js'
import qrTestRouter from './src/routes/qrcode.router.js'
import verifySubjectRouter from './src/routes/verifyrough.router.js'
import topicWiseRouter from './src/routes/topicwise.router.js'

const app = express();
const port = 3085;
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.get('/', (req, res) => {
  res.status(200).json({
    message: "👁️ Hello, developer. You've reached the API. It’s been waiting.",
    status: "online-ish",
    warnings: [
      "Do not feed the endpoints after midnight.",
      "Avoid /deleteAll unless you're feeling brave.",
      "Some routes are... haunted."
    ],
    tip: "The real bug was inside you all along."
  });
});


app.use('/api/qr', qrTestRouter); // get student ids and verify them
app.use('/api/students', studentRoutes);
app.use("/api/question", questionRout);
app.use("/api/metest", meTest);
app.use("/api/recommendtest", recotest);
app.use("/api/air-predictor", airPredictorRoutes);
app.use("/api", startrecotestRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/admintest", Admintest);
app.use("/api/fulltest", FullTestRoute);
app.use("/api/createtest", createtestRoute); // test
app.use("/api/test", pasttestRoute);
app.use("/api/dashboard", dashboardRoute);
app.use('/api/studentdata', studentviewRoute);
app.use("/api/admintest", admingenerateRoute); // test
app.use("/api/newadmin", newAdminRoute);
app.use("/api/dashboard", dsb);
app.use("/api/logout", studentslogged)
app.use("/api/testresult", testresult)
app.use("/api/spotlight", spotlight)
app.use("/api/loginattendance", loginattendance)
app.use("/api/practicetest" ,practice)
app.use("/api/generatetest", customize);
app.use('/api/user', userprofile);
app.use('/api', sendEmailrouter);
app.use("/api/superadmin", superAdminRouter);
app.use("/api/batches", batchRouter)
app.use("/api", fastquizquestion);
app.use("/api", noticeRouter);
app.use("/api", omrRouter);
app.use('/api', questionInsertionRouter);
app.use('/api', uploadImageRouter);
app.use("/api", PreviousYearQuestionRouter);
app.use("/api/verify", verifySubjectRouter);
app.use("/api/topic-wise", topicWiseRouter);
// app.use("/api/demo")

app.use("/api/review", reviewQuestion);
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

