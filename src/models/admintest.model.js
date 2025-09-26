import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const Admintest = sequelizeCon.define(
  "Admintest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    addedByAdminId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "addedByAdminId", // ensure correct mapping if DB column is camelCase
    },
    testname: { type: DataTypes.STRING, allowNull: false },
    difficulty: {
      type: DataTypes.ENUM("Easy", "Medium", "Difficult"),
      allowNull: false,
    },
    subject: { type: DataTypes.STRING, allowNull: false },
    marks: { type: DataTypes.STRING, allowNull: false },
    positivemarks: { type: DataTypes.INTEGER, allowNull: false },
    negativemarks: { type: DataTypes.INTEGER, allowNull: false },
    correctanswer: { type: DataTypes.JSON, allowNull: true },
    question_ids: { type: DataTypes.JSON, allowNull: true },
    unitName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "unitName", // <-- match the column name in your DB
    },
    topic_name: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "topic_name", // or "topicName" depending on DB
    },

    no_of_questions: { type: DataTypes.STRING(255), allowNull: true },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "questions",
        key: "id",
      },
    },
    duration: { type: DataTypes.INTEGER, allowNull: false },
    exam_start_date: { type: DataTypes.DATE, allowNull: false },
    exam_end_date: { type: DataTypes.DATE, allowNull: false },
    instruction: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "Admintests",
    timestamps: true
  }
);

export default Admintest;
