import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const TestSeries = sequelizeCon.define(
  "TestSeries",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdByAdminId: {
      type: DataTypes.INTEGER, // references Admin/Teacher
      allowNull: false,
    },
    visibility: {
      type: DataTypes.ENUM("assigned_only", "public"),
      allowNull: false,
      defaultValue: "assigned_only",
    },
    totalTests: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default TestSeries;
