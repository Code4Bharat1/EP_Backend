import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const College = sequelizeCon.define("College", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  college_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  intake: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gen_cutoff: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ews_cutoff: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  obc_cutoff: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sc_cutoff: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  st_cutoff: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: "colleges",
  timestamps: false,
});

export default College;
