// StudentBatch.js
import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

// StudentBatch.js
const StudentBatch = sequelizeCon.define(
  "StudentBatch",
  {
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "student_id",
      primaryKey: true,
      references: { model: "Students", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    batchId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "batch_id",
      primaryKey: true,
      references: { model: "Batches", key: "batch_id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "BatchStudents",
    timestamps: false,
    freezeTableName: true,
    underscored: true,
    // ──> disable auto‑adding an `id` column
    id: false
  }
);



// …and/or:
StudentBatch.removeAttribute('id');

// await sequelizeCon.sync({ alter: false });

export { StudentBatch };
