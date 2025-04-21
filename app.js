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
app.use('/api/students', studentRoutes);
app.use("/api/question", questionRout);
app.use("/api/metest", meTest);
app.use("/api/recommendtest", recotest);
app.use("/api/air-predictor", airPredictorRoutes);
app.use("/api", startrecotestRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/admintest", Admintest);
app.use("/api/fulltest", FullTestRoute);
app.use("/api/createtest", createtestRoute);
app.use("/api/test", pasttestRoute);
app.use("/api/dashboard", dashboardRoute);
app.use('/api/studentdata', studentviewRoute);
app.use("/api/admintest", admingenerateRoute);
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

