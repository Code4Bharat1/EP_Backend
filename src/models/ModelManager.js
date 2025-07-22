import { sequelizeCon } from "../init/dbConnection.js";
import Student from "./student.model.js"; // if exported default
import { Batch } from "./admin.model.js"; // if exported named
import { StudentBatch } from "./BatchStudent.model.js"; // join table

// Correct many-to-many setup
Student.belongsToMany(Batch, {
  through: StudentBatch,
  foreignKey: 'studentId',
  otherKey:   'batchId'
});
Batch.belongsToMany(Student, {
  through: StudentBatch,
  foreignKey: 'batchId',
  otherKey:   'studentId'
});

// Sync only in dev
// sync with no alters
// await sequelizeCon.sync({ alter: false });


export { Student, Batch, StudentBatch };
