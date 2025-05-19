import Student from "../models/student.model.js";
import bcrypt from "bcrypt";
import { Batch } from "../models/admin.model.js";

import { Sequelize } from "sequelize";

// Controller to fetch student information
const getStudentInfo = async (
  req,
  res
) => {
  try {
    // Extract the admin ID from the request body
    const { addedByAdminId } = req.body;

    if (!addedByAdminId) {
      return res
        .status(400)
        .json({
          message:
            "Admin ID is required",
        });
    }

    // Fetching specific fields from the Student table where addedByAdminId matches
    const studentData =
      await Student.findAll({
        attributes: [
          "id",
          "firstName", // Student's first name
          "lastName", // Student's last name
          "emailAddress", // Student's email address
          "mobileNumber", // Student's phone number
          "gender", // Student's gender
          "dateOfBirth", // Student's date of birth
          "isVerified", // Whether the student is verified or not
          "addedByAdminId", // Shows the adminid (2)
        ],
        where: {
          addedByAdminId:
            addedByAdminId, // Filter students by addedByAdminId
        },
      });

    // If no students found, return an error response
    if (studentData.length === 0) {
      return res
        .status(404)
        .json({
          message:
            "No students found for the given admin",
        });
    }

    // Format the data to include full name and status (active/inactive)
    const studentInfo = studentData.map(
      (student) => {
        // Getting the firstname and lastname inside fullname
        const fullName = `${student.firstName} ${student.lastName}`;
        const status =
          student.isVerified
            ? "Active"
            : "Inactive";

        return {
          id: student.id,
          fullName,
          email: student.emailAddress,
          phoneNumber:
            student.mobileNumber,
          gender: student.gender,
          dateOfBirth:
            student.dateOfBirth,
          status,
          addedByAdminId:
            student.addedByAdminId,
        };
      }
    );

    // Send response with formatted student info
    res
      .status(200)
      .json({ studentInfo });
  } catch (error) {
    console.error(
      "Error fetching student data:",
      error
    );
    res
      .status(500)
      .json({
        message:
          "Internal Server Error",
      });
  }
};

// Controller to save student information with specific fields
const saveBasicStudentData = async (
  req,
  res
) => {
  try {
    // Destructure the required data from the request body
    const {
      email,
      password,
      firstName,
      dateOfBirth,
      phoneNumber,
      gender,
      addedByAdminId,
    } = req.body;
    console.log(
      email,
      password,
      firstName,
      dateOfBirth,
      phoneNumber,
      gender,
      addedByAdminId
    );

    // Validate if all required fields are present
    if (
      !email ||
      !password ||
      !firstName ||
      !dateOfBirth ||
      !phoneNumber ||
      !gender ||
      !addedByAdminId
    ) {
      return res
        .status(400)
        .json({
          message:
            "All fields are required",
        });
    }

    // Validate email format
    const emailRegex =
      /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid email format",
        });
    }

    // Check if the email already exists
    const existingStudent =
      await Student.findOne({
        where: {
          emailAddress: email,
          addedByAdminId,
        },
      });
    if (existingStudent) {
      return res
        .status(409)
        .json({
          message:
            "Email already exists",
        });
    }

    // Create a new student instance with the data
    const newStudent =
      await Student.create({
        emailAddress: email,
        password,
        firstName: firstName,
        dateOfBirth: dateOfBirth,
        mobileNumber: phoneNumber,
        gender: gender,
        addedByAdminId: addedByAdminId, // Save the addedByAdminId received in the request body
        batchId: null,
        lastName: null,
        examType: null,
        studentClass: null,
        targetYear: null,
        fullName: `${firstName} ${""}`, // Example of setting fullName based on firstName (you can improve this)
        fullAddress: null,
        domicileState: null,
        parentName: null,
        parentContactNumber: null,
        relationToStudent: null,
        tenthBoard: null,
        tenthYearOfPassing: null,
        tenthPercentage: null,
        eleventhYearOfCompletion: null,
        eleventhPercentage: null,
        twelfthBoard: null,
        twelfthYearOfPassing: null,
        twelfthPercentage: null,
        hasAppearedForNEET: null,
        neetAttempts: [],
        targetMarks: null,
        hasTargetFlexibility: null,
        deferredColleges: null,
        preferredCourses: null,
        enrolledInCoachingInstitute:
          null,
        coachingInstituteName: null,
        studyMode: null,
        dailyStudyHours: null,
        takesPracticeTestsRegularly: false,
        completedMockTests: 0,
        mockTestConfidence: null,
        subjectNeedsMostAttention: null,
        chapterWiseTests: null,
        topicWiseTests: null,
        weakAreas: null,
        profileImage: null,
      });

    // Return the created student data (you can exclude sensitive fields)
    const studentResponse = {
      id: newStudent.id,
      emailAddress:
        newStudent.emailAddress,
      firstName: newStudent.firstName,
      dateOfBirth:
        newStudent.dateOfBirth,
      mobileNumber:
        newStudent.mobileNumber,
      gender: newStudent.gender,
    };

    // Send a success response with the created student data
    return res
      .status(201)
      .json({
        message:
          "Student created successfully",
        student: studentResponse,
      });
  } catch (error) {
    console.error(
      "Error saving student data:",
      error
    );
    return res
      .status(500)
      .json({
        message:
          "Internal Server Error",
      });
  }
};

const bulkSaveStudents = async (
  req,
  res
) => {
  try {
    // Destructure the student data array from the request body
    const { students } = req.body;

    // Arrays to hold valid student data and existing emails
    const studentData = [];
    const existingEmails = [];

    // Loop through each student and perform the necessary operations
    for (const student of students) {
      const {
        emailAddress,
        password,
        firstName,
        dateOfBirth,
        mobileNumber,
        gender,
        addedByAdminId,
      } = student;

      // Validate if all required fields are present
      if (
        !emailAddress ||
        !password ||
        !firstName ||
        !dateOfBirth ||
        !mobileNumber ||
        !gender
      ) {
        return res
          .status(400)
          .json({
            message:
              "All fields are required for all students",
          });
      }

      // Check if the email already exists
      const existingStudent =
        await Student.findOne({
          where: { emailAddress },
        });
      if (existingStudent) {
        existingEmails.push(
          emailAddress
        ); // Collect existing emails to report later
        continue; // Skip adding this student to the database
      }

      // Hash the password before saving (uncomment if using bcrypt)
      // const hashedPassword = await bcrypt.hash(password, 10);

      // Create the student object for bulk insertion
      studentData.push({
        emailAddress,
        password, // Save hashed password if needed
        firstName,
        dateOfBirth,
        mobileNumber,
        gender,
        addedByAdminId,
        batchId: null,
        lastName: null,
        examType: null,
        studentClass: null,
        targetYear: null,
        fullName: null,
        fullAddress: null,
        domicileState: null,
        parentName: null,
        parentContactNumber: null,
        relationToStudent: null,
        tenthBoard: null,
        tenthYearOfPassing: null,
        tenthPercentage: null,
        eleventhYearOfCompletion: null,
        eleventhPercentage: null,
        twelfthBoard: null,
        twelfthYearOfPassing: null,
        twelfthPercentage: null,
        hasAppearedForNEET: null,
        neetAttempts: [],
        targetMarks: null,
        hasTargetFlexibility: null,
        deferredColleges: null,
        preferredCourses: null,
        enrolledInCoachingInstitute:
          null,
        coachingInstituteName: null,
        studyMode: null,
        dailyStudyHours: null,
        takesPracticeTestsRegularly: false,
        completedMockTests: 0,
        mockTestConfidence: null,
        subjectNeedsMostAttention: null,
        chapterWiseTests: null,
        topicWiseTests: null,
        weakAreas: null,
        profileImage: null,
      });
    }

    // If there are valid students, save them to the database
    if (studentData.length > 0) {
      // Use Sequelize's bulkCreate method to insert valid students into the database
      const savedStudents =
        await Student.bulkCreate(
          studentData
        );

      // If there were any email conflicts, return the existing emails along with saved students
      if (existingEmails.length > 0) {
        return res.status(409).json({
          message:
            "Emails already exist for some students.",
          existingEmails,
          savedStudents,
        });
      }

      // Respond with the saved students
      res.status(201).json({
        message:
          "Students added successfully",
        students: savedStudents,
      });
    } else {
      res
        .status(400)
        .json({
          message:
            "No valid students to add",
        });
    }
  } catch (error) {
    console.error(
      "Error saving student data:",
      error
    );
    res
      .status(500)
      .json({
        message:
          "Internal Server Error",
        error: error.message,
      });
  }
};

// controller to update batchId for multiple students based on emails
const updateBatchIdForUsers = async (
  req,
  res
) => {
  try {
    const { emails, batchId } =
      req.body;

    // Validate if emails and batchId are provided
    if (
      !emails ||
      !Array.isArray(emails) ||
      emails.length === 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "Emails are required and should be an array",
        });
    }

    if (!batchId) {
      return res
        .status(400)
        .json({
          message:
            "Batch ID is required",
        });
    }

    // Loop through each email and update the corresponding user
    const updatedStudents = [];
    for (let email of emails) {
      const student =
        await Student.findOne({
          where: {
            emailAddress: email,
          },
        });

      if (!student) {
        // If student not found, skip to the next email
        continue;
      }

      // Update the batchId for the student
      student.batchId = batchId;
      await student.save();

      updatedStudents.push(student); // Collect the updated student data
    }

    // If no students were updated, send an appropriate response
    if (updatedStudents.length === 0) {
      return res
        .status(404)
        .json({
          message:
            "No students found with the provided emails",
        });
    }

    // Send a success response
    return res.status(200).json({
      message: `${updatedStudents.length} student(s) updated successfully`,
      updatedStudents,
    });
  } catch (error) {
    console.error(
      "Error updating batchId:",
      error
    );
    return res
      .status(500)
      .json({
        message:
          "Internal Server Error",
      });
  }
};

// Controller to save new batch information
const createBatch = async (req, res) => {
  try {
    const { batchId, batchName, no_of_students } = req.body;
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(400).json({
        message: "Admin ID is required",
      });
    }

    // Validate if all required fields are present
    if (!batchId || !batchName || !no_of_students) {
      return res.status(400).json({
        message: "Batch ID, Batch Name, and Number of Students are required.",
      });
    }

    // Check if batchId already exists (globally unique)
    const existingBatchById = await Batch.findOne({
      where: { batchId },
    });
    if (existingBatchById) {
      return res.status(409).json({
        message: "Batch ID already exists",
      });
    }

    // Check if same admin already has a batch with the same name
    const existingBatchByNameForAdmin = await Batch.findOne({
      where: {
        batchName,
        admin_id: adminId,
      },
    });
    if (existingBatchByNameForAdmin) {
      return res.status(409).json({
        message: "You already have a batch with this name",
      });
    }

    // Create the new batch
    const newBatch = await Batch.create({
      batchId,
      batchName,
      no_of_students,
      admin_id: adminId,
    });

    res.status(201).json({
      message: "Batch created successfully",
      batch: newBatch,
    });
  } catch (error) {
    console.error("Error creating batch:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//get batch names
const getBatchNames = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required." });
    }

    const batchData = await Batch.findAll({
      where: { admin_id: adminId },
      attributes: ['batchName'],
    });

    if (batchData.length === 0) {
      return res.status(404).json({
        message: "No batches found.",
      });
    }

    return res.status(200).json({ batchData });

  } catch (error) {
    console.error("Error fetching batch names:", error);
    return res.status(500).json({
      message: "Error finding batches",
      error: error.message
    });
  }
};


const getBatchInfo = async (
  req,
  res
) => {
  try {
    const adminId = req.adminId; // Assuming adminId is sent in the request body
    if (!adminId) {
      return res
        .status(400)
        .json({
          message:
            "Admin ID is required",
        });
    }

    // Fetching batch information from the Batches table
    const batchData =
      await Batch.findAll({
        attributes: [
          "batchId",
          "batchName",
          "no_of_students",

        ],
        where: {
          admin_id: req.adminId,
        },
      });

    // If no batch data found, return an error response
    if (batchData.length === 0) {
      return res
        .status(404)
        .json({
          message: "No batches found",
        });
    }
    // Return the retrieved batch data in the response
    res.status(200).json({ batchData });
  } catch (error) {
    console.error(
      "Error fetching batch data:",
      error
    );
    res
      .status(500)
      .json({
        message:
          "Internal Server Error",
      });
  }
};

//controller to delete the batches from the batches table
const deleteBatch = async (
  req,
  res
) => {
  try {
    const { batch_Id } = req.params;

    // Find and delete the batch
    const batch = await Batch.findOne({
      where: { batch_Id },
    });
    if (!batch) {
      return res
        .status(404)
        .json({
          message: "Batch not found",
        });
    }

    await batch.destroy(); // Delete the batch from the database

    res
      .status(200)
      .json({
        message:
          "Batch deleted successfully",
      });
  } catch (error) {
    console.error(
      "Error deleting batch:",
      error
    );
    res
      .status(500)
      .json({
        message:
          "Internal Server Error",
      });
  }
};

export default getStudentInfo;
export {
  saveBasicStudentData,
  bulkSaveStudents,
  updateBatchIdForUsers,
  createBatch,
  getBatchInfo,
  getBatchNames
};
