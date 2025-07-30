import { sequelizeCon, DataTypes } from "../init/dbConnection.js";
import Admintest from "./admintest.model.js"; // Adjust if path differs

const AkshTest = sequelizeCon.define(
  "AkshTest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    testId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "admintests",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON, // Expects an array of options
      allowNull: false,
    },
    correct_option: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    negativemarks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

await sequelizeCon.sync({ alter: true }); // ⚠️ Use `alter: true` carefully in production
console.log("✅ Models synced with DB.");

// Association
AkshTest.belongsTo(Admintest, { foreignKey: "testId" });
Admintest.hasMany(AkshTest, { foreignKey: "testId" }); 

export default AkshTest;
