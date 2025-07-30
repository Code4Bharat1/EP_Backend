import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const TeacherQuestion = sequelizeCon.define(
  "TeacherQuestion",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    teacherId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    chapter: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON, // Example: ["Option A", "Option B", "Option C", "Option D"]
      allowNull: false,
    },
    answer: {
      type: DataTypes.ENUM("a", "b", "c", "d"),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      allowNull: false,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  },
  {
    timestamps: true,
  }
);

export default TeacherQuestion;
