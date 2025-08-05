import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const TestSeriesQuestions = sequelizeCon.define(
  "TestSeriesQuestions",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    testId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    options: {
      type: DataTypes.JSON,
      allowNull: false,
      // Example: ["Option A", "Option B", "Option C", "Option D"]
    },

    correctAnswer: {
      type: DataTypes.STRING,
      allowNull: false,
      // Example: "A", "B", "C", "D"
    },

    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    marks: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
    },

    negativeMarks: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    difficulty: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      defaultValue: "medium",
    },

    questionType: {
      type: DataTypes.ENUM("MCQ", "Short Answer", "True/False", "Assertion-Reason"),
      defaultValue: "MCQ",
    },
  },
  {
    timestamps: true,
  }
);

export default TestSeriesQuestions;
