import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const Admin = sequelizeCon.define(
  "Admin",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    AdminId: { type: DataTypes.STRING(255), allowNull: true, unique: true },
    PassKey: { type: DataTypes.STRING, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: true },
    Course: { type: DataTypes.STRING, allowNull: true },

    // Who this person is in the system
    role: {
      type: DataTypes.ENUM("superadmin", "admin", "editor", "viewer"),
      allowNull: false,
      defaultValue: "admin",
    },

    Email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: { isEmail: true },
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [10, 10], isNumeric: true },
    },
    whatsappNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { len: [10, 10], isNumeric: true },
    },

    StartDate: { type: DataTypes.DATEONLY, allowNull: true },
    ExpiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    HodName: { type: DataTypes.STRING, allowNull: true },

    logo: { type: DataTypes.STRING, allowNull: true },
    navbarColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#3B82F6",
    },
    sidebarColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#1E40AF",
    },
    otherColor: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#1F2937",
    },

    credentials: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },

    // NEW: self-reference — which Admin created this admin
    created_by_admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Admins", key: "id" }, // string to avoid forward ref
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "Admins",
    timestamps: true,
    underscored: true,
  }
);

const Batch = sequelizeCon.define(
  "Batch",
  {
    batchId: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Admins", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    batchName: { type: DataTypes.STRING, allowNull: true },
    no_of_students: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "Batches",
    timestamps: true,
    underscored: true,
  }
);

// Admin → Batch
Admin.hasMany(Batch, { foreignKey: "admin_id", onDelete: "SET NULL" });
Batch.belongsTo(Admin, { foreignKey: "admin_id" });

// SELF-ASSOCIATION (Admin → Admin)
Admin.hasMany(Admin, {
  as: "CreatedAdmins", // admin.CreatedAdmins -> list of admins this admin created
  foreignKey: "created_by_admin_id",
});
Admin.belongsTo(Admin, {
  as: "CreatedBy", // admin.CreatedBy -> the admin who created this admin
  foreignKey: "created_by_admin_id",
});

// await sequelizeCon.sync({ alter: true });

export { Admin, Batch };
