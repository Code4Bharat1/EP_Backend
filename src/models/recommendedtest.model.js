import { Sequelize, DataTypes } from "sequelize";
import { sequelizeCon } from "../init/dbConnection.js"; // Your database connection

// Define the RecommendedTest model
const RecommendedTest = sequelizeCon.define(
  "RecommendedTest",
  {
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Custom Test",
    },
    difficultyLevel: {
      type: DataTypes.ENUM("Easy", "Medium", "Hard"),
      allowNull: false,
      defaultValue: "Medium",
    },
    recommendedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "System",
    },
     correctanswer: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    wronganswer: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    notattempted: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    total_marks: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "in-progress"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Define the SubjectUnit model
const SubjectUnit = sequelizeCon.define(
  "SubjectUnit",
  {
    recommendedTestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: RecommendedTest, // Use the actual Sequelize model, not a string
        key: "id",
      },
      onDelete: "CASCADE",  // Ensures deletion of child records if the parent is deleted
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unitName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    weightage: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    expectedQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM("Easy", "Medium", "Hard"),
      allowNull: false,
    },
    timeToComplete: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    focusPriority: {
      type: DataTypes.ENUM("Low", "Medium", "High"),
      allowNull: false,
    },
    recommendedTests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Define the AttemptedRecoTest model
const AttemptedRecoTest = sequelizeCon.define(
  "AttemptedRecoTest",
  {
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    recommendedTestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "RecommendedTests", // Referencing the RecommendedTest model
        key: "id", // Primary key in RecommendedTest
      },
    },
    correctAnswers: {
      type: DataTypes.JSON, // Stores the correct answers in JSON format
      allowNull: true,
    },
    wrongAnswers: {
      type: DataTypes.JSON, // Stores the wrong answers in JSON format
      allowNull: true,
    },
    notAttempted: {
      type: DataTypes.JSON, // Stores the not attempted answers in JSON format
      allowNull: true,
    },
    totalMarks: {
      type: DataTypes.JSON, // Stores the total marks in JSON format
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "in-progress"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Set up relationships

// RecommendedTest <-> SubjectUnit (One-to-many)
RecommendedTest.hasMany(SubjectUnit, {
  foreignKey: "recommendedTestId",
  as: "units",
});

SubjectUnit.belongsTo(RecommendedTest, {
  foreignKey: "recommendedTestId",
  as: "test",
});

// RecommendedTest <-> AttemptedRecoTest (One-to-many)
RecommendedTest.hasMany(AttemptedRecoTest, {
  foreignKey: "recommendedTestId",
  as: "attempts",
});

AttemptedRecoTest.belongsTo(RecommendedTest, {
  foreignKey: "recommendedTestId",
  as: "test",
});

// await sequelizeCon.sync({ alter: true });
// await sequelizeCon.sync(); // Avoid altering schema forcefully


export { RecommendedTest, SubjectUnit, AttemptedRecoTest };

