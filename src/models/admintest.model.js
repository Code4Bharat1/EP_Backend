import { sequelizeCon, DataTypes } from "../init/dbConnection.js";


const Admintest = sequelizeCon.define("Admintest", {
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
  batch_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // ✅ New batchId field
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "batches", // 👈 Replace with your actual Batch table name
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
},
{
  timestamps: true,
});

// await sequelizeCon.sync({ alter: true }); // ✅ `alter` keeps data, updates structure

// await sequelizeCon.sync({ force: false,alter: true  });

export default Admintest;
