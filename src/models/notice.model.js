import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const NoticeSection = sequelizeCon.define("NoticeSection", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    adminId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "admin_id"
    },
    noticeText: {
        type: DataTypes.TEXT, // better for long content
        allowNull: false,
        field: "notice_text"
    },
    noticeTitle: {
        type: DataTypes.STRING,
        allowNull: true,
        field: "notice_title"
    },
    noticeStartDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "notice_start_date"
    },
    noticeEndDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "notice_end_date"
    },
    batchName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "batch_name"
    }
}, {
    timestamps: true,
    tableName: "notice_section"
});

export default NoticeSection;
