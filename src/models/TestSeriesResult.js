import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const TestResult = sequelizeCon.define(
  "TestResult",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // Foreign key to TestSeriesTest
    testId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Foreign key to student/user
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    seriesId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Track attempts
    attemptNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Score tracking
    totalMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    marksObtained: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    incorrectAnswers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unattempted: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    // Time taken for this attempt (in minutes)
    timeTaken: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["studentId", "testId", "attemptNumber"], // prevent duplicate attempt numbers
      },
    ],
  }
);

export default TestResult;
