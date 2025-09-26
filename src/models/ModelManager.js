import { sequelizeCon } from "../init/dbConnection.js";
import Student from "./student.model.js"; // if exported default
import { Batch } from "./admin.model.js"; // if exported named
import { StudentBatch } from "./BatchStudent.model.js"; // join table

import TestSeries from "./TestSeries.model.js";
import TestSeriesTest from "./TestSeriesTest.model.js";
import TestSeriesQuestions from "./TestSeriesQuestions.model.js";
import TestResult from "./TestSeriesResult.js"; // ✅ import this
import StudentAnalytics from "./studentAnalytics.model.js";

import Admintest from "./admintest.model.js";
import BatchAdmintest from "./BatchAdmintest.model.js";

/* ----------------------- TestSeries <-> TestSeriesTest ----------------------- */

TestSeries.hasMany(TestSeriesTest, {
  foreignKey: "seriesId",
  as: "tests",
  onDelete: "CASCADE",
});

TestSeriesTest.belongsTo(TestSeries, {
  foreignKey: "seriesId",
  as: "series",
});

/* -------------------- TestSeriesTest <-> TestSeriesQuestions -------------------- */

TestSeriesTest.hasMany(TestSeriesQuestions, {
  foreignKey: "testId",
  as: "questions",
  onDelete: "CASCADE",
});

TestSeriesQuestions.belongsTo(TestSeriesTest, {
  foreignKey: "testId",
  as: "test",
});

/* -------------------------- Student <-> Batch (Many-to-Many) -------------------------- */

Student.belongsToMany(Batch, {
  through: StudentBatch,
  foreignKey: "studentId",
  otherKey: "batchId",
});
Batch.belongsToMany(Student, {
  through: StudentBatch,
  foreignKey: "batchId",
  otherKey: "studentId",
});

/* ------------------------- TestSeriesTest <-> TestResult ------------------------- */

// 1 Test can have many TestResults (for different students or multiple attempts)
TestSeriesTest.hasMany(TestResult, {
  foreignKey: "testId",
  as: "results",
  onDelete: "CASCADE",
});
TestResult.belongsTo(TestSeriesTest, {
  foreignKey: "testId",
  as: "test",
});
TestResult.belongsTo(TestSeries, { foreignKey: "seriesId" });

/* ---------------------------- Student <-> TestResult ---------------------------- */

// 1 Student can have many TestResults
Student.hasMany(TestResult, {
  foreignKey: "studentId",
  as: "testResults",
  onDelete: "CASCADE",
});
TestResult.belongsTo(Student, {
  foreignKey: "studentId",
  as: "student",
});

/*----------------------------Student <-> Student Analytics -----------------------*/

// 1 student ↔ 1 analytics row
Student.hasOne(StudentAnalytics, {
  foreignKey: { name: "student_id", allowNull: false },
  as: "analytics",
  onDelete: "CASCADE", // delete analytics when student is deleted
});

StudentAnalytics.belongsTo(Student, {
  foreignKey: { name: "student_id", allowNull: false },
  as: "student",
});

/* --------------------------- ✅ Batch <-> Admintest (Many-to-Many) --------------------------- */
Batch.belongsToMany(Admintest, {
  through: BatchAdmintest,
  foreignKey: "batchId", // points to BatchAdmintest.batchId
  otherKey: "admintestId", // points to BatchAdmintest.admintestId
  as: "tests", // now you can do batch.getTests()
});

Admintest.belongsToMany(Batch, {
  through: BatchAdmintest,
  foreignKey: "admintestId",
  otherKey: "batchId",
  as: "batches", // now you can do admintest.getBatches()
});

// ✅ EXPORT all
export {
  Student,
  Batch,
  StudentBatch,
  TestSeries,
  TestSeriesTest,
  TestSeriesQuestions,
  TestResult, // ✅ include this
  Admintest, // ✅ export
  BatchAdmintest, // ✅ export
};
