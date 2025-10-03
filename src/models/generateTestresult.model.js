import { sequelizeCon, DataTypes } from "../init/dbConnection.js";
import Admintest from "./admintest.model.js";
import Student from "./student.model.js";

const GenerateTestResult = sequelizeCon.define(
  "GenerateTestResult",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,  // ✅ unique ID for each result row
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Student,   // ✅ link Student model
        key: "id",
      },
    },
    testid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Admintest, // ✅ link Admin test model
        key: "id",
      },
    },
    testname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    selectedChapters: { type: DataTypes.JSON, allowNull: true },
    answers: { type: DataTypes.JSON, allowNull: true },
    score: { type: DataTypes.INTEGER, allowNull: true },
    correctAnswers: { type: DataTypes.INTEGER, allowNull: true },
    incorrectAnswers: { type: DataTypes.INTEGER, allowNull: true },
    unattempted: { type: DataTypes.INTEGER, allowNull: true },
    totalquestions: { type: DataTypes.INTEGER, allowNull: true },
    overallmarks: { type: DataTypes.INTEGER, allowNull: true },
    subjectWiseMarks: { type: DataTypes.JSON, allowNull: true },
    status: {
      type: DataTypes.ENUM("Pending", "Completed", "Reviewed", "Cancelled"),
      allowNull: false,
      defaultValue: "Pending",
    },
  },
  {
    tableName: "GenerateTestResults",
    timestamps: true,
  }
);

export default GenerateTestResult;
