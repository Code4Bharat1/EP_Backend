import { DataTypes } from "sequelize";
import { sequelizeCon } from "../init/dbConnection.js";

const Otp = sequelizeCon.define(
  "Otp",
  {
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    // ✅ New column — used to identify OTP purpose (login/signup/reset)
    purpose: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "general",
    },

    // ✅ New column — used after successful verification
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "Otps",
  }
);

export default Otp;
