// admin.model.js

import { sequelizeCon, DataTypes } from '../init/dbConnection.js';
import Student from './student.model.js';
import { StudentBatch } from './BatchStudent.model.js';
const Admin = sequelizeCon.define(
  'Admin',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    AdminId: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    PassKey: { type: DataTypes.STRING, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: true },
    Course: { type: DataTypes.STRING, allowNull: true },

    // Who this person is in the system
    role: {
      type: DataTypes.ENUM('superadmin', 'admin', 'sub-admin', 'batchmanager', 'teacher', 'supporter', 'content_manager'),
      allowNull: false,
      defaultValue: 'teacher',
    },

    Email: {
      type: DataTypes.STRING,
      allowNull: true,
      // unique: true,
      validate: { isEmail: true },
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [10, 10], isNumeric: true },
    },
    // In your Admin model definition
    whatsappNumber: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null values
      validate: {
        // Only validate if value is provided
        isNumeric: {
          msg: 'WhatsApp number must contain only digits',
        },
        len: {
          args: [10, 15],
          msg: 'WhatsApp number must be between 10 and 15 digits',
        },
      },
    },

    StartDate: { type: DataTypes.DATEONLY, allowNull: true },
    ExpiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    HodName: { type: DataTypes.STRING, allowNull: true },

    logo: { type: DataTypes.STRING, allowNull: true },
    navbarColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#3B82F6',
    },

    instituteName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    branch: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [1, 100],
      },
    },

    sidebarColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#1E40AF',
    },
    otherColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#1F2937',
    },

    credentials: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },

    // NEW: self-reference — which Admin created this admin
    created_by_admin_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: { model: 'Admins', key: 'AdminId' }, // keep reference if needed
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
  },
  {
    tableName: 'Admins',
    timestamps: true,
    underscored: true,
  }
);

const Batch = sequelizeCon.define(
  'Batch',
  {
    batchId: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Admins', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    batchName: { type: DataTypes.STRING, allowNull: true },
    no_of_students: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Inactive',
    },
  },
  {
    tableName: 'Batches',
    timestamps: true,
    underscored: true,
  }
);

// Admin → Batch
Admin.hasMany(Batch, { foreignKey: 'admin_id', onDelete: 'SET NULL' });
Batch.belongsTo(Admin, { foreignKey: 'admin_id' });

// SELF-ASSOCIATION (Admin → Admin)
Admin.hasMany(Admin, {
  as: 'CreatedAdmins', // admin.CreatedAdmins -> list of admins this admin created
  foreignKey: 'created_by_admin_id',
});
Admin.belongsTo(Admin, {
  as: 'CreatedBy', // admin.CreatedBy -> the admin who created this admin
  foreignKey: 'created_by_admin_id',
});

// Batch ↔ Student (Many-to-Many)
Batch.belongsToMany(Student, {
  through: StudentBatch,
  foreignKey: 'batchId',
  otherKey: 'studentId',
  as: 'Students', // Use this exact alias name
});

Student.belongsToMany(Batch, {
  through: StudentBatch,
  foreignKey: 'studentId',
  otherKey: 'batchId',
  as: 'Batches',
});

// await sequelizeCon.sync({ alter: true });

export { Admin, Batch };
