// StudentBatch.js
import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const StudentBatch = sequelizeCon.define(
  "StudentBatch",
  {
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "student_id", // DB column name
      references: {
        model: "Students",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      primaryKey: true, // ✅ Composite primary key
    },
    batchId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "batch_id", // DB column name
      references: {
        model: "Batches",
        key: "batch_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
      primaryKey: true, // ✅ Composite primary key
    },
  },
  {
    tableName: "StudentBatches",
    timestamps: false,
    freezeTableName: true,
    underscored: true,
  }
);

export { StudentBatch };
