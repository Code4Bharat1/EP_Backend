import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const TestSeriesTest = sequelizeCon.define(
  "TestSeriesTest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    seriesId: {
      type: DataTypes.INTEGER, // nullable for standalone tests
      allowNull: true,
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Identify test origin
    testType: {
      type: DataTypes.ENUM("series", "custom"),
      defaultValue: "custom",
    },

    // Who created it (teacher/admin)
    createdByAdminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Who can access it
    visibility: {
      type: DataTypes.ENUM("assigned_only", "public"),
      allowNull: false,
      defaultValue: "assigned_only",
    },

    // Duration in minutes
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    maxQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100, // or whatever default you prefer
    },

    // Time window
    openDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closeDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Control visibility
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

export default TestSeriesTest;
