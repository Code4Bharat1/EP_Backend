import Student from "../models/student.model.js";
import bcrypt from "bcrypt";
import { Batch } from "../models/admin.model.js";
import {
  Student as StudentModel,
  Batch as BatchModel,
  StudentBatch,
} from "../models/ModelManager.js";
import { Op } from "sequelize";

// Controller to fetch student information
const getStudentInfo = async (req, res) => {
  try {
    const { addedByAdminId } = req.body;

    if (!addedByAdminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const studentData = await Student.findAll({
      attributes: [
        "id",
        "firstName",
        "lastName",
        "emailAddress",
        "mobileNumber",
        "gender",
        "dateOfBirth",
        "isVerified",
        "addedByAdminId",
      ],
      where: { addedByAdminId },
    });

    if (studentData.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found for the given admin" });
    }

    const studentInfo = studentData.map((student) => {
      const fullName = `${student.firstName} ${student.lastName}`;
      const status = student.isVerified ? "Active" : "Inactive";

      return {
        id: student.id,
        fullName,
        email: student.emailAddress,
        phoneNumber: student.mobileNumber,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        status,
        addedByAdminId: student.addedByAdminId,
      };
    });

    res.status(200).json({ studentInfo });
  } catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getStudentInfoByBatch = async (req, res) => {
  try {
    const { addedByAdminId, batchId } = req.body;
    console.log("Added By Admin ID:", addedByAdminId);
    console.log("Batch ID:", batchId);
    if (!addedByAdminId || !batchId) {
      return res
        .status(400)
        .json({ message: "Both Admin ID and Batch ID are required" });
    }

    const batch = await Batch.findOne({
      where: { batchId }, // use the attribute name
      include: [
        {
          model: Student,
          as: "Students", // must match the `as` above
          attributes: [
            "id",
            "firstName",
            "lastName",
            "emailAddress",
            "mobileNumber",
            "gender",
            "dateOfBirth",
            "isVerified",
            "addedByAdminId",
          ],
          through: { attributes: [] },
        },
      ],
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }
    console.log("Batch Students:", batch);

    const studentInfo = batch.Students.filter(
      (s) => String(s.addedByAdminId) === String(addedByAdminId)
    ).map((s) => ({
      id: s.id,
      fullName: `${s.firstName} ${s.lastName}`,
      email: s.emailAddress,
      phone: s.mobileNumber,
      status: s.isVerified ? "Active" : "Inactive",
    }));

    if (!studentInfo.length) {
      return res
        .status(404)
        .json({ message: "No students in this batch for that admin" });
    }

    return res.status(200).json({ studentInfo });
  } catch (error) {
    console.error("Error fetching student data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller to save student information with specific fields
const saveBasicStudentData = async (req, res) => {
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
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Validate email format
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Check if the email already exists
    const existingStudent = await Student.findOne({
      where: {
        [Op.and]: [
          { addedByAdminId }, // Ensure the admin ID is considered
          {
            [Op.or]: [
              { emailAddress: email }, // Check email uniqueness for the admin
              { mobileNumber: phoneNumber }, // Check phone number uniqueness for the admin
            ],
          },
        ],
      },
    });
    if (existingStudent) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    // Create a new student instance with the data
    const newStudent = await Student.create({
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
      enrolledInCoachingInstitute: null,
      coachingInstituteName: null,
      studyMode: null,
      dailyStudyHours: null,
      takesPracticeTestsRegularly: false,
      completedMockTests: 0,
      Credits: 0,
      subjectNeedsMostAttention: null,
      chapterWiseTests: null,
      topicWiseTests: null,
      weakAreas: null,
      profileImage: null,
    });

    // Return the created student data (you can exclude sensitive fields)
    const studentResponse = {
      id: newStudent.id,
      emailAddress: newStudent.emailAddress,
      firstName: newStudent.firstName,
      dateOfBirth: newStudent.dateOfBirth,
      mobileNumber: newStudent.mobileNumber,
      gender: newStudent.gender,
    };

    // Send a success response with the created student data
    return res.status(201).json({
      message: "Student created successfully",
      student: studentResponse,
    });
  } catch (error) {
    console.error("Error saving student data:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const deleteStudentById = async (req, res) => {
  try {
    /*-----------------------------------------------------------
      1.  Get the student-ID
          – prefer URL param  /students/:id
          – fallback to body - so your existing front-end call
            (axios .delete … { data:{ id } }) still works
    -----------------------------------------------------------*/
    const studentId = req.params.id || req.body.id;

    if (!studentId) {
      return res.status(400).json({
        message: "Student ID is required",
      });
    }

    /*-----------------------------------------------------------
      2.  Find the student
    -----------------------------------------------------------*/
    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    /*-----------------------------------------------------------
      3.  Delete and confirm
    -----------------------------------------------------------*/
    await student.destroy(); // or  Student.destroy({ where:{ id:studentId } })

    return res.status(200).json({
      message: "Student deleted successfully",
      deletedStudentId: studentId,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const bulkSaveStudents = async (req, res) => {
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
        return res.status(400).json({
          message: "All fields are required for all students",
        });
      }

      // Check if the email already exists
      const existingStudent = await Student.findOne({
        where: { emailAddress },
      });
      if (existingStudent) {
        existingEmails.push(emailAddress); // Collect existing emails to report later
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
        enrolledInCoachingInstitute: null,
        coachingInstituteName: null,
        studyMode: null,
        dailyStudyHours: null,
        takesPracticeTestsRegularly: false,
        completedMockTests: 0,
        Credits: 0,
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
      const savedStudents = await Student.bulkCreate(studentData);

      // If there were any email conflicts, return the existing emails along with saved students
      if (existingEmails.length > 0) {
        return res.status(409).json({
          message: "Emails already exist for some students.",
          existingEmails,
          savedStudents,
        });
      }

      // Respond with the saved students
      res.status(201).json({
        message: "Students added successfully",
        students: savedStudents,
      });
    } else {
      res.status(400).json({
        message: "No valid students to add",
      });
    }
  } catch (error) {
    console.error("Error saving student data:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// controller to update batchId for multiple students based on emails
const updateBatchIdForUsers = async (req, res) => {
  try {
    const { emails, batchId } = req.body;

    // Validate if emails and batchId are provided
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        message: "Emails are required and should be an array",
      });
    }

    if (!batchId) {
      return res.status(400).json({
        message: "Batch ID is required",
      });
    }

    // Loop through each email and update the corresponding user
    const updatedStudents = [];
    for (let email of emails) {
      const student = await Student.findOne({
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
      return res.status(404).json({
        message: "No students found with the provided emails",
      });
    }

    // Send a success response
    return res.status(200).json({
      message: `${updatedStudents.length} student(s) updated successfully`,
      updatedStudents,
    });
  } catch (error) {
    console.error("Error updating batchId:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

//deleting students from the students table
// const deleteStudent = async (student) => {
//   try {
//     const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/studentdata/delete`, {
//       data: { id: student.id }
//     });
//     if (response.status === 200) {
//       setStudents((prevStudents) => prevStudents.filter((s) => s.id !== student.id));
//       toast.success("Student deleted successfully", {
//         duration: 5000
//       });
//     }
//   } catch (error) {
//     console.error("Error deleting student:", error);
//     toast.error("Error deleting student", {
//       duration: 5000
//     });
//   }
// };

// Controller to save new batch information
const createBatch = async (req, res) => {
  try {
    const { batchName, no_of_students, studentIds, status } = req.body;
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    if (
      !batchName ||
      !no_of_students ||
      !Array.isArray(studentIds) ||
      typeof status !== "boolean"
    ) {
      return res.status(400).json({
        message:
          "Batch Name, Number of Students, Student IDs (array), and Status are required.",
      });
    }

    // Get the current year and month
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0"); // Ensure MM format

    // Find the last batch in the current year and month to get the next sequence number
    const lastBatch = await Batch.findOne({
      where: { batchId: { [Op.like]: `BATCH-${year}-${month}-%` } },
      order: [["batchId", "DESC"]], // Order in descending order to get the latest batch
    });

    const sequenceNumber = lastBatch
      ? parseInt(lastBatch.batchId.split("-")[3]) + 1
      : 1; // Increment the sequence number or start at 1 if no batch exists

    const batchId = `BATCH-${year}-${month}-${sequenceNumber.toString().padStart(3, "0")}`;

    // Check if batch already exists by the generated ID
    const existingBatchById = await Batch.findOne({ where: { batchId } });
    if (existingBatchById) {
      return res.status(409).json({ message: "Batch ID already exists" });
    }

    // Check if a batch with the same name already exists for the admin
    const existingBatchByName = await Batch.findOne({
      where: { batchName, admin_id: adminId },
    });
    if (existingBatchByName) {
      return res
        .status(409)
        .json({ message: "You already have a batch with this name" });
    }

    // Create the new batch
    const newBatch = await Batch.create({
      batchId,
      batchName,
      no_of_students,
      status,
      admin_id: adminId,
    });

    // Add students to the batch if provided
    if (studentIds.length > 0) {
      const students = await Student.findAll({
        where: { id: studentIds },
      });

      if (students.length !== studentIds.length) {
        return res
          .status(400)
          .json({ message: "One or more student IDs are invalid" });
      }

      // Add students to the batch
      await newBatch.addStudents(students);
    }

    return res.status(201).json({
      message: "Batch created successfully",
      batch: newBatch,
    });
  } catch (error) {
    console.error("Error creating batch:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// controllers to get batch by ID
const getBatchById = async (req, res) => {
  try {
    const { batchId } = req.params;
    const adminId = req.adminId;

    const batch = await Batch.findOne({
      where: { batchId, admin_id: adminId },
      include: [
        {
          model: Student,
          as: "Students",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "emailAddress",
            "mobileNumber",
            "isVerified",
          ],
          through: { attributes: [] },
        },
      ],
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    return res.status(200).json({ batch });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller to update an existing batch
const updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params; // Passed in the URL
    const { batchName, no_of_students, status, studentIds } = req.body;
    const adminId = req.adminId;
    console.log("Admin ID:", adminId);

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Check if the batch exists and belongs to the admin
    const batch = await Batch.findOne({
      where: { batchId, admin_id: adminId },
      include: [Student], // Optional: preload students
    });

    if (!batch) {
      return res
        .status(404)
        .json({ message: "Batch not found or unauthorized" });
    }

    // Update fields if provided
    if (batchName) batch.batchName = batchName;
    if (typeof no_of_students === "number")
      batch.no_of_students = no_of_students;
    if (typeof status === "boolean") batch.status = status;

    // Save updated batch
    await batch.save();

    // Handle new student additions
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const newStudents = await Student.findAll({
        where: { id: studentIds },
      });

      if (newStudents.length !== studentIds.length) {
        return res
          .status(400)
          .json({ message: "One or more student IDs are invalid" });
      }

      // Add new students without removing existing ones
      await batch.addStudents(newStudents); // Sequelize will prevent duplicates if defined correctly
    }

    res.status(200).json({
      message: "Batch updated successfully",
      batch,
    });
  } catch (error) {
    console.error("Error updating batch:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

//controller to delete the batches from the batches table
const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params; // use `batchId` for consistency
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Find the batch by batchId and admin_id
    const batch = await Batch.findOne({
      where: { batchId, admin_id: adminId },
    });

    if (!batch) {
      return res
        .status(404)
        .json({ message: "Batch not found or unauthorized" });
    }

    // Optionally remove student associations before deleting (if many-to-many)
    await batch.setStudents([]); // Clears associated students

    // Delete the batch
    await batch.destroy();

    res.status(200).json({ message: "Batch deleted successfully" });
  } catch (error) {
    console.error("Error deleting batch:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
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
      attributes: ["batch_id", "batchName"], // 👈 include batchId (id)
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
      error: error.message,
    });
  }
};

const getBatchInfo = async (req, res) => {
  try {
    const adminId = req.adminId; // Assuming adminId is sent in the request body
    if (!adminId) {
      return res.status(400).json({
        message: "Admin ID is required",
      });
    }

    // Fetching batch information from the Batches table
    const batchData = await Batch.findAll({
      attributes: ["batchId", "batchName", "no_of_students"],
      where: {
        admin_id: req.adminId,
      },
    });

    // If no batch data found, return an error response
    if (batchData.length === 0) {
      return res.status(404).json({
        message: "No batches found",
      });
    }
    // Return the retrieved batch data in the response
    res.status(200).json({ batchData });
  } catch (error) {
    console.error("Error fetching batch data:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export default getStudentInfo;
export {
  saveBasicStudentData,
  bulkSaveStudents,
  updateBatchIdForUsers,
  createBatch,
  updateBatch,
  getBatchById,
  deleteBatch,
  getBatchInfo,
  deleteStudentById,
  getBatchNames,
  getStudentInfoByBatch,
};
