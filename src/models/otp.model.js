import { DataTypes } from "sequelize";
import { sequelizeCon } from "../init/dbConnection.js";

const Otp = sequelizeCon.define("Otp", {
  emailAddress: { type: DataTypes.STRING, allowNull: false },
  otp: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
}, {
  timestamps: true,
  tableName: "Otps"
});

export default Otp;
