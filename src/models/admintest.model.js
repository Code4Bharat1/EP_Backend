import { sequelizeCon, DataTypes } from "../init/dbConnection.js";
import { Batch } from "./admin.model.js" // Import the Batch model;

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
    },
    testname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM("Easy", "Medium", "Difficult"),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marks: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    positivemarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    negativemarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    correctanswer: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    question_ids: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    unitName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    topic_name: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    no_of_questions: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "questions",
        key: "id",
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exam_start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    exam_end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    instruction: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Replace batch_name with batchId foreign key
    batchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Batch,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

// Define association
Admintest.belongsTo(Batch, { foreignKey: "batchId" });
Batch.hasMany(Admintest, { foreignKey: "batchId" });

export default Admintest;
