import Student from "../models/student.model.js";
import bcrypt from "bcrypt"
import { Batch } from "../models/admin.model.js";
import { Sequelize } from "sequelize";

// Controller to fetch student information
const getStudentInfo = async (req, res) => {
  try {
    // Fetching specific fields from the Student table
    const studentData = await Student.findAll({
      attributes: [
        "firstName", // Student's first name
        "lastName", // Student's last name
        "emailAddress", // Student's email address
        "mobileNumber", // Student's phone number
        "gender", // Student's gender
        "dateOfBirth", // Student's date of birth
        "isVerified", // Whether the student is verified or not
      ],
    });

    // If no student found, return an error response
    if (studentData.length === 0) {
      return res.status(404).json({ message: "No student found" });
    }

    // Format the data to include full name and status (active/inactive)
    const studentInfo = studentData.map((student) => {
        //getting the firstname and lastname inside fullname
      const fullName = `${student.firstName} ${student.lastName}`;
      const status = student.isVerified ? "Active" : "Inactive";

      return {
        fullName,
        email: student.emailAddress,
        phoneNumber: student.mobileNumber,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        status,
      };
    });

    // Send response with formatted student info
    res.status(200).json({ studentInfo });
  } catch (error) {
    console.error("Error fetching student data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller to save student information with specific fields
const saveBasicStudentData = async (req, res) => {
  try {
    // Destructure the required data from the request body
    const { email, password, firstName, dateOfBirth, phoneNumber, gender } = req.body;

    // Validate if all required fields are present
    if (!email || !password || !firstName || !dateOfBirth || !phoneNumber || !gender) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the email already exists
    const existingStudent = await Student.findOne({ where: { emailAddress: email } });
    if (existingStudent) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new student instance with the data, leaving other fields as null
    const newStudent = await Student.create({
      emailAddress: email,
      password: hashedPassword, // Save hashed password
      firstName: firstName,
      dateOfBirth: dateOfBirth,
      mobileNumber: phoneNumber,
      gender: gender,
      // Set default null values for other fields
      addedByAdminId: null,
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
      mockTestConfidence: null,
      subjectNeedsMostAttention: null,
      chapterWiseTests: null,
      topicWiseTests: null,
      weakAreas: null,
      profileImage: null,
    });

    // Send a success response with the created student data
    res.status(201).json({ message: "Student created successfully", student: newStudent });
  } catch (error) {
    console.error("Error saving student data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const bulkSaveStudents = async (req, res) => {
  try {
    // Destructure the student data array from the request body
    const { students } = req.body;

    // Validate if student data exists
    if (!students || students.length === 0) {
      return res.status(400).json({ message: "No student data provided" });
    }

    const studentData = [];
    const existingEmails = [];

    // Loop through each student and perform the necessary operations
    for (const student of students) {
      const { email, password, firstName, dateOfBirth, phoneNumber, gender } = student;

      // Validate if all required fields are present
      if (!email || !password || !firstName || !dateOfBirth || !phoneNumber || !gender) {
        return res.status(400).json({ message: "All fields are required for all students" });
      }

      // Check if the email already exists
      const existingStudent = await Student.findOne({ where: { emailAddress: email } });
      if (existingStudent) {
        existingEmails.push(email); // Collect existing emails to report later
        continue; // Skip this student if email already exists
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the student object for bulk insertion
      studentData.push({
        emailAddress: email,
        password: hashedPassword, // Save hashed password
        firstName: firstName,
        dateOfBirth: dateOfBirth,
        mobileNumber: phoneNumber,
        gender: gender,
        addedByAdminId: null,
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
        mockTestConfidence: null,
        subjectNeedsMostAttention: null,
        chapterWiseTests: null,
        topicWiseTests: null,
        weakAreas: null,
        profileImage: null,
      });
    }

    if (studentData.length > 0) {
      // Insert the valid students into the database
      const savedStudents = await Student.insertMany(studentData);

      // Check if there were any email conflicts
      if (existingEmails.length > 0) {
        return res.status(409).json({
          message: "Some students were not added due to existing emails",
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
      res.status(400).json({ message: "No valid students to add" });
    }
  } catch (error) {
    console.error("Error saving student data:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// controller to update batchId for multiple students based on emails
const updateBatchIdForUsers = async (req, res) => {
  try {
    const { emails, batchId } = req.body;

    // Validate if emails and batchId are provided
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "Emails are required and should be an array" });
    }

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    // Loop through each email and update the corresponding user
    const updatedStudents = [];
    for (let email of emails) {
      const student = await Student.findOne({ where: { emailAddress: email } });

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
      return res.status(404).json({ message: "No students found with the provided emails" });
    }

    // Send a success response
    return res.status(200).json({
      message: `${updatedStudents.length} student(s) updated successfully`,
      updatedStudents
    });
  } catch (error) {
    console.error("Error updating batchId:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


// Controller to save new batch information
const createBatch = async (req, res) => {
  try {
    // Destructure batch details from the request body
    const { batchId, batchName, no_of_students } = req.body;

    // Validate if all required fields are present
    if (!batchId || !batchName || !no_of_students) {
      return res.status(400).json({ message: "Batch ID, Batch Name, and Number of Students are required." });
    }

    // Check if batchId already exists in the Batches table
    const existingBatch = await Batch.findOne({ where: { batchId } });
    if (existingBatch) {
      return res.status(409).json({ message: "Batch ID already exists" });
    }

    // Create a new batch entry in the database
    const newBatch = await Batch.create({
      batchId, // Unique batch ID
      batchName, // Batch name
      no_of_students, // Number of students in the batch
      admin_id: null, // Keeping admin_id as null for now
    });

    // Return the created batch details in the response
    res.status(201).json({ message: "Batch created successfully", batch: newBatch });
  } catch (error) {
    console.error("Error creating batch:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const getBatchInfo = async (req, res) => {
  try {
    // Fetching batch information from the Batches table
    const batchData = await Batch.findAll({
      attributes: ['batchId', 'batchName', 'no_of_students'], // Specify the columns to retrieve
    });

    // If no batch data found, return an error response
    if (batchData.length === 0) {
      return res.status(404).json({ message: "No batches found" });
    }

    // Return the retrieved batch data in the response
    res.status(200).json({ batchData });
  } catch (error) {
    console.error("Error fetching batch data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//controller to delete the batches from the batches table
const deleteBatch = async (req, res) => {
  try {
    const { batch_Id } = req.params;

    // Find and delete the batch
    const batch = await Batch.findOne({ where: { batch_Id } });
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    await batch.destroy(); // Delete the batch from the database

    res.status(200).json({ message: "Batch deleted successfully" });
  } catch (error) {
    console.error("Error deleting batch:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export default getStudentInfo;
export {saveBasicStudentData, bulkSaveStudents, updateBatchIdForUsers, createBatch, getBatchInfo};
