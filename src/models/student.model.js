// Sync all models
import { sequelizeCon, DataTypes, Model } from "../init/dbConnection.js";
import bcrypt from "bcrypt";

const Student = sequelizeCon.define(
  "Student",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    demoExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Core fields
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    addedByAdminId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    batchId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // In student.model.js
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Password is required" },
        notEmpty: { msg: "Password cannot be empty" },
        isString(value) {
          if (typeof value !== "string") {
            throw new Error("Password must be a string");
          }
        },
      },
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },

    // Add missing fields for personal data
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    examType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    studentClass: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    targetYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Profile fields
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[A-Za-z\s]+$/, // Optional: validation for full name (letters and spaces)
      },
    },
    dateOfBirth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["Male", "Female", "Other"]], // gender validation
      },
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [10, 10], // Phone number length check
        isNumeric: true,
      },
    },
    fullAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    domicileState: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentContactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [10, 10], // Phone number length check
        isNumeric: true,
      },
    },
    relationToStudent: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["Father", "Mother", "Guardian"]], // Relation validation
      },
    },
    // Education-related fields
    tenthBoard: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["CBSE", "ICSE", "State Board", "Other"]], // Board validation
      },
    },

    tenthYearOfPassing: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 2018,
        max: new Date().getFullYear(),
      },
    },
    tenthPercentage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    eleventhYearOfCompletion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 2019,
        max: new Date().getFullYear(),
      },
    },
    eleventhPercentage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    twelfthBoard: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["CBSE", "ICSE", "State Board", "Other"]], // Board validation
      },
    },
    twelfthYearOfPassing: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: true,
        min: 2019,
        max: new Date().getFullYear(),
      },
    },
    twelfthPercentage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },

    // NEET-related fields
    hasAppearedForNEET: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    neetAttempts: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("Must be an array");
          }
        },
      },
    },
    targetMarks: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 720,
      },
    },
    hasTargetFlexibility: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    deferredColleges: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    preferredCourses: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // Coaching-related fields
    enrolledInCoachingInstitute: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    coachingInstituteName: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // Study-related fields
    studyMode: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["Self-study", "Coaching classes", "Both"]],
      },
    },
    dailyStudyHours: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [
          ["Less than 2 hours", "2–4 hours", "4–6 hours", "More than 6 hours"],
        ],
      },
    },
    takesPracticeTestsRegularly: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    completedMockTests: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    Credits: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subjectNeedsMostAttention: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["Physics", "Chemistry", "Biology", "All equally"]],
      },
    },

    // Test-related fields
    chapterWiseTests: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    topicWiseTests: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    weakAreas: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // Profile image (optional)
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeCon,
    modelName: "Student",
    tableName: "Students",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["addedByAdminId", "emailAddress"], // per-admin email uniqueness
      },
      {
        unique: true,
        fields: ["addedByAdminId", "mobileNumber"], // per-admin mobile uniqueness
      },
    ],
  }
);

Student.beforeCreate(async (student, options) => {
  // Only hash the password if it's not already hashed
  if (!student.password.startsWith("$2")) {
    // console.log("Hashing password in beforeCreate hook");
    const hashedPassword = await bcrypt.hash(student.password, 10);
    student.password = hashedPassword;
  } else {
    // console.log(
    //   "Skipping password hashing in beforeCreate hook (already hashed)"
    // );
  }
});

Student.beforeUpdate(async (student, options) => {
  // Only hash the password if it has been modified and is not already hashed
  if (student.changed("password") && !student.password.startsWith("$2")) {
    // console.log("Hashing password in beforeUpdate hook");
    const hashedPassword = await bcrypt.hash(student.password, 10);
    student.password = hashedPassword;
  } else {
    // console.log(
    //   "Skipping password hashing in beforeUpdate hook (already hashed)"
    // );
  }
});

// Student.sync({ alter: true })
//   .then(() => console.log("Student table synced successfully"))
//   .catch((err) => console.error("Error syncing Student table:", err));

export default Student;
