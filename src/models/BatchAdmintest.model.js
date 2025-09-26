// models/BatchAdmintest.model.js
import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const BatchAdmintest = sequelizeCon.define(
  "BatchAdmintest",
  {
    batchId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "batch_id",
      references: { model: "Batches", key: "batch_id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    admintestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "admintest_id",
      references: { model: "Admintests", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "BatchAdmintests",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "ba_unique_batch_test",
        unique: true,
        fields: ["batch_id", "admintest_id"],
      },
    ],
  }
);

export default BatchAdmintest;
