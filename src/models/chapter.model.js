// import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

// // Ensure the database connection is successful
// sequelizeCon.authenticate()
//   .then(() => {
//     console.log("Database connected successfully");
//   })
//   .catch(err => {
//     console.error("Unable to connect to the database:", err);
//   });

// // Chapter Model
// const Chapter = sequelizeCon.define('Chapter', {
//   id: {
//     type: DataTypes.INTEGER,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   subjectName: { // Name of the subject this chapter belongs to
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   chapterName: { // Name of the chapter
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique: true,
//   },
//   allocatedQuestions: { // Number of questions allocated
//     type: DataTypes.INTEGER,
//     defaultValue: 0,
//   },
//   allocatedTime: { // Time allocated to the chapter
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   recommendedTests: { // Recommended number of tests
//     type: DataTypes.INTEGER,
//     defaultValue: 1,
//   },
// }, {
//   tableName: 'chapters',
//   timestamps: true,
// });

// // Sync the Chapter table with the database
// Chapter.sync({ alter: true })
//   .then(() => console.log("Chapter table synced successfully"))
//   .catch((err) => {
//     console.error("Error syncing Chapter table:", err);
//   });

// export default Chapter;
