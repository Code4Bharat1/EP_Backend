// src/models/everytestmode.refrence.js

import { sequelizeCon, DataTypes } from "../init/dbConnection.js";

// Pdf Model
const Pdf = sequelizeCon.define("Pdf", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  exam_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  topic_tags: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  difficulty_level: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  upload_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "pdfs",
  timestamps: false,
});

// Topic Model
const Topic = sequelizeCon.define("Topic", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  exam_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true,
    set(value) {
      // If user supplies "Chemistry", it gets stored as "chemistry"
      if (value) this.setDataValue("subject", value.toLowerCase());
    },
  },
  topic_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    set(value) {
      // "Atomic Structure" becomes "atomic structure"
      if (value) this.setDataValue("topic_name", value.toLowerCase());
    },
  },
}, {
  tableName: "topics",
  timestamps: false,
});


// Diagram Model
const Diagram = sequelizeCon.define("Diagram", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Set to false if diagrams must always be linked to a question
    references: {
      model: "questions",
      key: "id",
    },
  },
  diagram_path: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  upload_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "diagrams",
  timestamps: false,
});

// Question Model
const Question = sequelizeCon.define("Question", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  pdf_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pdf,
      key: "id",
    },
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  topic_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Topic,
      key: "id",
    },  
  },
}, {
  tableName: "questions",
  timestamps: false,
});

// Option Model
const Option = sequelizeCon.define("Option", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Question,
      key: "id",
    },
  },
  option_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: "options",
  timestamps: false,
});

// Solution Model
const Solution = sequelizeCon.define("Solution", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Question,
      key: "id",
    },
  },
  solution_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: "solutions",
  timestamps: false,
});

// Associations

// Pdf <-> Question
Pdf.hasMany(Question, { foreignKey: "pdf_id", onDelete: "CASCADE" });
Question.belongsTo(Pdf, { foreignKey: "pdf_id" });

// Topic <-> Question
Topic.hasMany(Question, { foreignKey: "topic_id" });
Question.belongsTo(Topic, { foreignKey: "topic_id" });

// Question <-> Option
Question.hasMany(Option, {
  foreignKey: "question_id",
  onDelete: "CASCADE",
  as: "options",
});
Option.belongsTo(Question, { foreignKey: "question_id" });

// Question <-> Solution
Question.hasMany(Solution, { foreignKey: "question_id", onDelete: "CASCADE" });
Solution.belongsTo(Question, { foreignKey: "question_id" });

// Question <-> Diagram
Question.hasMany(Diagram, { foreignKey: "question_id", onDelete: "CASCADE" });
Diagram.belongsTo(Question, { foreignKey: "question_id" });
// const syncModels = async () => {
//   try {
//     await sequelizeCon.sync({ alter: true }); // Use 'alter' to update tables without dropping them
//     console.log('All models were synchronized successfully.');
//   } catch (error) {
//     console.error('Error synchronizing models:', error);
//   }
// };

// syncModels();
export { Pdf, Question, Option, Solution, Diagram, Topic };
