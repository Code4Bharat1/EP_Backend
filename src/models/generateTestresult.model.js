import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const generateTestResult = sequelizeCon.define("GenerateTestResult", {
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  testid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  testname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  selectedChapters: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  answers: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  correctAnswers: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  incorrectAnswers: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  unattempted: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  totalquestions: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  overallmarks: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  subjectWiseMarks: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true, 
});

export default generateTestResult;
