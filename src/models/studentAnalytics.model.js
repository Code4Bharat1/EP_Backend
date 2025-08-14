// models/studentAnalytics.model.js
import { DataTypes } from "sequelize";
import { sequelizeCon } from "../init/dbConnection.js"; // <- adjust path to your connection

const StudentAnalytics = sequelizeCon.define(
    "StudentAnalytics",
    {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        student_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, unique: true },
        subject_mastery: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
        chapter_mastery: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
        topic_mastery: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
        recent_windows: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: { overall_last5: null, Physics_last5: null, Chemistry_last5: null, Biology_last5: null },
        },
        ai_plan: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
    },
    {
        tableName: "student_analytics",
        timestamps: true,
        // ✅ no `indexes` here
    }
);

export default StudentAnalytics;
