import { sequelizeCon, DataTypes } from "../init/dbConnection.js";
import Student from "../models/student.model.js";

const FullTestResults = sequelizeCon.define("fullTestResults", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Student,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  testName: {
    type: DataTypes.STRING,
    defaultValue: "Full Test",
  },
  difficultyLevel: {
    type: DataTypes.STRING,
    defaultValue: "Simple",
  },
  recommendedBy: {
    type: DataTypes.STRING,
    defaultValue: "Start Test",
  },
  status: {
    type: DataTypes.ENUM("Completed", "Pending"),
    allowNull: false,
  },
  totalQuestions: {
    type: DataTypes.INTEGER, // ✅ Stores total number of questions
    allowNull: false,
  },
  correctAnswers: {
    type: DataTypes.JSON, // ✅ Stores array of correct answers with details
    allowNull: false,
  },
  wrongAnswers: {
    type: DataTypes.JSON, // ✅ Stores array of incorrect answers with details
    allowNull: false,
  },
  notAttempted: {
    type: DataTypes.JSON, // ✅ Stores array of not attempted questions
    allowNull: false,
  },
  correctAnswersCount: {
    type: DataTypes.INTEGER, // ✅ New column for numeric correct answer count
    allowNull: false,
    defaultValue: 0,
  },
  wrongAnswersCount: {
    type: DataTypes.INTEGER, 
    allowNull: false,
    defaultValue: 0,
  },
  notAttemptedCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  marksObtained: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalMarks: {
    type: DataTypes.INTEGER, // Always stores 720
    allowNull: false,
    defaultValue: 720, // ✅ Set total marks to 720 by default
  },
  subjectWisePerformance: {
    type: DataTypes.JSON, // ✅ Stores subject-wise analytics
    allowNull: false,
  },
  chapterWisePerformance: {
    type: DataTypes.JSON, // ✅ Stores chapter-wise analytics
    allowNull: false,
  },
  detailedAnswers: {
    type: DataTypes.JSON, // ✅ Stores complete test details with answers & solutions
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

await sequelizeCon.sync(); 
export default FullTestResults;
