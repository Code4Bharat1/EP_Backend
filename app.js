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

const app = express();
const port = config.get('port') || 3306;
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

