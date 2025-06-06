import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const PreviousYearQuestion = sequelizeCon.define("previousyearquestion", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  Year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  questions: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  correctAnswer: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  solution: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  diagramUrl: {
    type: DataTypes.STRING,
    allowNull: true, // image is optional
  }
}, {
  tableName: "previousyearquestions",
  timestamps: true,
});

export default PreviousYearQuestion;
