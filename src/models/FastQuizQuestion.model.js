import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

const FastQuizQuestion = sequelizeCon.define("FastQuizQuestion", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    questionText: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    questionOption: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    correctAnswer: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    questionExplanation: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: true,
});

export default FastQuizQuestion;
