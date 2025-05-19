import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const QuestionReview = sequelizeCon.define("QuestionReview",{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    question_Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    question_Text :  {
        type: DataTypes.STRING,
        allowNull: false,
    },
    subject_Name : {
        type: DataTypes.STRING,
        allowNull: false,
    },
    admin_Id : {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    chapter_Name : {
        type: DataTypes.STRING,
        allowNull: false,
    }
},{
    timestamps: true,
})

export default QuestionReview;