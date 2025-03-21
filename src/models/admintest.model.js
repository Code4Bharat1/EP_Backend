import { sequelizeCon, DataTypes } from "../init/dbConnection.js";


const Admintest = sequelizeCon.define("Admintest",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          addedByAdminId: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          testname: {
            type: DataTypes.STRING,
            allowNull: false,
          },
          difficulty: {
            type: DataTypes.ENUM('Easy', 'Medium', 'Difficult'),
            allowNull: false,
          },
          subject: {
            type: DataTypes.ENUM('Physics', 'Chemistry', 'Biology'),
            allowNull: false,
          },
          marks: {
            type: DataTypes.ENUM('180', '360', '720'),
            allowNull: false,
          },
          positivemarks: {
            type: DataTypes.ENUM('1', '2', '4','5','6','10'),
            allowNull: false,
          },
          negativemarks: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          correctanswer: {
            type: DataTypes.JSON,
            allowNull: true,
          },
          wronganswer: {
            type: DataTypes.JSON,
            allowNull: true,
          },
          unitName: {
            type: DataTypes.STRING,
            allowNull: false, 
          },
          topic_name: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          no_of_questions: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
          question_id: {
            type: DataTypes.INTEGER,
            allowNull: true, 
            references: {
              model: "questions",
              key: "id",
            },
          },
          duration: {
            type: DataTypes.INTEGER,
            allowNull: false, 
          },
          exam_start_date: {
            type: DataTypes.DATE,
            allowNull: false, 
          },
          exam_end_date: {
            type: DataTypes.DATE,
            allowNull: false, 
          },
          instruction: {
            type: DataTypes.STRING,
            allowNull: false, 
          },
          batch_name: {
            type: DataTypes.STRING,
            allowNull: false, 
          },
          status: {
            type: DataTypes.STRING,
            allowNull: false, 
          },
        
    },
    {
        timestamps: true,
      }
);

// await sequelizeCon.sync({ force: false,alter: true  });

export default Admintest;
