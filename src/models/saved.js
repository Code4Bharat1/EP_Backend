// src/models/meTest.model.js

import { sequelizeCon, DataTypes } from "../init/dbConnection.js";
import Student from "./student.model.js";
import { Pdf } from "./everytestmode.refrence.js"; // Import the Pdf model

const MeTest = sequelizeCon.define(
  "MeTest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Student, key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Untitled Test",
    },
    selectedChapters: {
      // Storing as JSON so you don't have to manually parse/stringify
      type: DataTypes.JSON,
      allowNull: false,
      /*
        Example Structure:
        {
          "biology": [
            { "name": "Human Physiology", "questionCount": 1, "totalMarks": 4 },
            { "name": "Cell Structure and Function", "questionCount": 2, "totalMarks": 8 }
          ],
          "chemistry": [
            { "name": "Atomic Structure", "questionCount": 1, "totalMarks": 4 }
          ]
        }
      */
    },
    difficultyLevel: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Medium",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "saved", // Possible values: "saved", "attempted", "completed"
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: true,
      /*
        Example Structure:
        {
          "questionId1": "optionId1",
          "questionId2": null,
          "questionId3": "optionId2",
          ...
        }
      */
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    correct: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    incorrect: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    unattempted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // Overall total marks for this test
    overAllMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // Subject-wise marks (updated to allow NULL to work with MariaDB)
    subjectWiseMarks: {
      type: DataTypes.JSON,
      allowNull: true,
      /*
        Example structure:
        {
          "physics": 40,
          "chemistry": 28,
          "biology": 32
        }
      */
    },
    pdf_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // or false if PDF is required
      references: {
        model: Pdf,
        key: "id",
      },
      onDelete: "SET NULL", // sets pdf_id = NULL if the PDF is deleted
      onUpdate: "CASCADE", // Ensures consistency when updating parent table

    },
  },
  {
    tableName: "MeTests",
    timestamps: true, // Creates createdAt and updatedAt columns
  }
);
// await sequelizeCon.sync({ alter: true });
// await sequelizeCon.sync(); // Avoid automatic schema changes

// Model Associations
Student.hasMany(MeTest, { foreignKey: "studentId", as: "meTests" });
MeTest.belongsTo(Student, { foreignKey: "studentId", as: "student" });

Pdf.hasMany(MeTest, { foreignKey: "pdf_id", as: "meTests" });
MeTest.belongsTo(Pdf, { foreignKey: "pdf_id", as: "pdf" });

export default MeTest;
