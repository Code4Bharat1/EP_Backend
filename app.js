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
import demoRoute from './src/routes/demo.route.js';
import teacherRouter from './src/routes/teacher.router.js';
import akashTest from "./src/routes/TestSeries.router.js"
import r from './src/routes/coach.routes.js';
import reviewTestRoute from './src/routes/reviewTest.route.js';
import './src/models/ModelManager.js'
import { sequelizeCon } from './src/init/dbConnection.js';

import sessionRoutes from "./src/routes/sessionRoutes.js";

import mysql from "mysql2/promise";

import helmet from "helmet";
import paymentRoutes from "./src/routes/paymentRoutes.js";


// ✅ MySQL Database Connection
let db;

const connectDB = async () => {
  try {
    db = await mysql.createConnection({
      host: "localhost",   // ya tu kaunsa host use kar raha hai (phpMyAdmin to localhost)
      user: "root",        // apna username
      password: "",        // apna MySQL password (agar blank hai to blank hi rehne de)
      database: "neet720", // apna database name
    });

    console.log("✅ MySQL Connected Successfully!");
    global.db = db; // global variable for controllers
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
  }
};

// call it
connectDB();


await sequelizeCon.authenticate();
await sequelizeCon.sync({ alter: false }); // ONE place only

const app = express();
const port = 3085;

// --- Secure CORS ---
const allowedOrigins = [
  "https://neet720.com",
  "https://www.neet720.com",
  "https://admin.neet720.com",
  "https://www.admin.neet720.com",
  "https://superadmin.neet720.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200, // for legacy browsers
};


// --- ✅ Helmet setup for best security ---
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "https:"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "font-src": ["'self'", "https:", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false, // important for Next.js images & analytics
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    frameguard: { action: "deny" }, // blocks clickjacking
  })
);

// --- Other middlewares ---
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// --- Root health check ---
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

// --- Route mounts ---
app.use("/api/qr", qrTestRouter);
app.use("/api/students", studentRoutes);
app.use("/api/question", questionRout);
app.use("/api/metest", meTest);
app.use("/api/recommendtest", recotest);
app.use("/api/air-predictor", airPredictorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admintest", Admintest);
app.use("/api/fulltest", FullTestRoute);
app.use("/api/createtest", createtestRoute);
app.use("/api/test", pasttestRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/studentdata", studentviewRoute);
app.use("/api/admintest", admingenerateRoute);
app.use("/api/newadmin", newAdminRoute);
app.use("/api/dashboard", dsb);
app.use("/api/logout", studentslogged);
app.use("/api/testresult", testresult);
app.use("/api/spotlight", spotlight);
app.use("/api/loginattendance", loginattendance);
app.use("/api/practicetest", practice);
app.use("/api/generatetest", customize);
app.use("/api/user", userprofile);
app.use("/api", sendEmailrouter);
app.use("/api/superadmin", superAdminRouter);
app.use("/api/batches", batchRouter);
app.use("/api", fastquizquestion);
app.use("/api", noticeRouter);
app.use("/api", omrRouter);
app.use("/api", questionInsertionRouter);
app.use("/api", uploadImageRouter);
app.use("/api", PreviousYearQuestionRouter);
app.use("/api/verify", verifySubjectRouter);
app.use("/api/topic-wise", topicWiseRouter);
app.use("/api/demo", demoRoute);
app.use("/api/teacher", teacherRouter);
app.use("/api/test-series", akashTest)
app.use("/api/coach", r)
app.use("/api/review", reviewTestRoute)

app.use("/api/review", reviewQuestion);
app.use("/api/sessions", sessionRoutes);
app.use("/api/payment", paymentRoutes)
// --- Start server ---
app.listen(port, () => {
  console.log(`🚀 Server running securely on port ${port}`);
});
