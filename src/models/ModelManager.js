import { sequelizeCon } from "../init/dbConnection.js";
import Student from "./student.model.js"; // if exported default
import { Batch } from "./admin.model.js"; // if exported named
import { StudentBatch } from "./BatchStudent.model.js"; // join table

import TestSeries from "./TestSeries.model.js"
import TestSeriesTest from "./TestSeriesTest.model.js";
import TestSeriesQuestions from "./TestSeriesQuestions.model.js";

/* ----------------------- TestSeries <-> TestSeriesTest ----------------------- */

// 1 TestSeries has many Tests
TestSeries.hasMany(TestSeriesTest, {
  foreignKey: "seriesId",
  as: "tests",
  onDelete: "CASCADE",
});

// 1 Test belongs to a TestSeries
TestSeriesTest.belongsTo(TestSeries, {
  foreignKey: "seriesId",
  as: "series",
});

/* -------------------- TestSeriesTest <-> TestSeriesQuestions -------------------- */

// 1 Test has many Questions
TestSeriesTest.hasMany(TestSeriesQuestions, {
  foreignKey: "testId",
  as: "questions",
  onDelete: "CASCADE",
});

// 1 Question belongs to a Test
TestSeriesQuestions.belongsTo(TestSeriesTest, {
  foreignKey: "testId",
  as: "test",
});

// Correct many-to-many setup
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

// Sync only in dev
// sync with no alters
// await sequelizeCon.sync({ alter: false });

export { Student, Batch, StudentBatch, TestSeries , TestSeriesTest , TestSeriesQuestions };
