import bcrypt from 'bcrypt';
import { Admin } from '../models/admin.model.js';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import config from 'config';
import Student from "../models/student.model.js";
import FullTestResults from '../models/fullTestResults.model.js';
import MeTest from '../models/saved.js';
import Admintest from '../models/admintest.model.js';
import { Question, Option } from '../models/everytestmode.refrence.js';
import generateTestResult from '../models/generateTestresult.model.js';
import { Batch } from '../models/admin.model.js';


// Controller to register a new admin
const createAdmin = async (req, res) => {
  const {
    AdminId,
    PassKey,
    name,
    Course,
    Email,
    mobileNumber,
    whatsappNumber,
    StartDate,
    ExpiryDate,
    address,
    HodName,
    logo,
    navbarColor,
    sidebarColor,
    otherColor,
  } = req.body;

  console.log(AdminId, PassKey,
    name,
    Course,
    Email,
    mobileNumber,
    whatsappNumber,
    StartDate,
    ExpiryDate,
    address,
    HodName,
    logo,
    navbarColor,
    sidebarColor,
    otherColor,)

  try {
    // Basic required field validation
    if (!AdminId || !PassKey || !name || !Email || !mobileNumber) {
      return res.status(400).json({ message: "Missing required fields." });
      console.log(AdminId, PassKey, name, Email, mobileNumber);
    }

    // Check for existing AdminId or Email
    const existingAdmin = await Admin.findOne({
      where: {
        [Op.or]: [{ AdminId }, { Email }]
      }
    });

    if (existingAdmin) {
      return res.status(400).json({ message: "Admin with this ID or Email already exists." });
    }

    // Hash the password
    const hashedPassKey = await bcrypt.hash(PassKey, 10);

    // Create new admin
    const newAdmin = await Admin.create({
      AdminId,
      PassKey: hashedPassKey,
      name,
      Course,
      Email,
      mobileNumber,
      whatsappNumber,
      StartDate,
      ExpiryDate,
      address,
      HodName,
      logo,
      navbarColor,
      sidebarColor,
      otherColor,
      credentials: "pending",
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        AdminId: newAdmin.AdminId,
        name: newAdmin.name,
        email: newAdmin.Email,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const loginAdmin = async (req, res) => {
  const { AdminId, PassKey } = req.body;

  try {
    // Validate if AdminId and PassKey are provided
    if (!AdminId || !PassKey) {
      return res.status(400).json({ message: "AdminId and PassKey are required." });
    }

    // Find the admin using AdminId instead of Email
    const admin = await Admin.findOne({ where: { AdminId } });

    if (!admin) {
      return res.status(401).json({ message: "Invalid AdminId or password." });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(PassKey, admin.PassKey);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid AdminId or password." });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: admin.id }, config.get("jwtSecret"), {
      expiresIn: "30d", // Token expires in 30 days
    });

    // Return success message along with the token and admin details
    return res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        AdminId: admin.AdminId,
        name: admin.name,
        Email: admin.Email,
        role: admin.credentials,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



// Controller to get selected fields of FullTestResults for all students
export const getTestSummariesForAllStudents = async (req, res) => {
  try {
    // Step 1: Get all student IDs
    const students = await Student.findAll({ attributes: ["id"] });
    const studentIds = students.map((student) => student.id);

    if (!studentIds.length) {
      return res.status(404).json({ message: "No students found." });
    }

    // Step 2: Get only selected test result fields for matching student IDs
    const testResults = await FullTestResults.findAll({
      where: {
        studentId: {
          [Op.in]: studentIds,
        },
      },
      attributes: ["testName", "marksObtained", "totalMarks", "subjectWisePerformance"],
    });

    return res.status(200).json({
      message: "Test summaries fetched successfully",
      count: testResults.length,
      results: testResults,
    });
  } catch (error) {
    console.error("Error fetching test summaries:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const createAdmintest = async (req, res) => {
  try {
    // Extract data from request body
    const {
      addedByAdminId,
      testname,
      difficulty,
      subject,
      marks,
      positivemarks,
      negativemarks,
      correctanswer,
      question_ids,
      unitName,
      topic_name,
      no_of_questions,
      question_id,
      duration,
      exam_start_date,
      exam_end_date,
      instruction,
      batch_name,
      batchId, // 👈 new
      status,
    } = req.body;

    // Decode JWT to extract admin ID
    let decodedAdminId = null;
    if (addedByAdminId) {
      const decoded = jwt.decode(addedByAdminId);
      if (decoded && decoded.id) {
        decodedAdminId = decoded.id;
      }
    }

    const adminId = decodedAdminId || null;

    // Convert subject array to string if needed
    const subjectString = Array.isArray(subject) ? subject.join(", ") : subject || null;

    // Build the test data
    const newTestData = {
      addedByAdminId: adminId,
      testname: testname || null,
      difficulty: difficulty || null,
      subject: subjectString,
      marks: marks || null,
      positivemarks: positivemarks || null,
      negativemarks: negativemarks || null,
      correctanswer: correctanswer || null,
      question_ids: question_ids || null,
      unitName: unitName || null,
      topic_name: topic_name || null,
      no_of_questions: no_of_questions || null,
      question_id: question_id || null,
      duration: duration || null,
      exam_start_date: exam_start_date ? new Date(exam_start_date) : null,
      exam_end_date: exam_end_date ? new Date(exam_end_date) : null,
      instruction: instruction || null,
      batch_name: batch_name || null,
      batchId: batchId || null, // 👈 added batchId
      status: status || null,
    };

    console.log("Test Data to be inserted:", newTestData);

    // Create the test
    const newTest = await Admintest.create(newTestData);

    return res.status(201).json({
      message: "Test created successfully",
      test: newTest,
    });
  } catch (error) {
    console.error("Error creating test:", error);
    return res.status(500).json({
      message: "Failed to create test",
      error: error.message,
    });
  }
};


//getting the testid according to the admin id

const getTestbyAdminId = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        message: "student id is required"
      })
    }

    const studentTests = await Admintest.findAll({
      where: { addedByAdminId: adminId }
    });

    if (studentTests.length === 0) {
      return res.status(404).json({
        message: "No test found for your admin"
      })
    }

    return res.status(200).json({
      message: "Test details fetched successfully",
      tests: studentTests
    })

  } catch (error) {
    console.error("Error Fetching Test");
    return res.status(500).json({
      message: "Failed to retrieve test details",
      error: error.message
    })
  }
}


// Controller to retrieve test details based on student's batch
export const getStudentTestDetails = async (req, res) => {
  try {
    // Get student ID from request (could be from params, body, or auth token)
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        message: "Student ID is required",
      });
    }

    // Find the student to get their batchId
    const student = await Student.findOne({
      where: { id: studentId },
      attributes: ['batchId'],
      raw: true
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (!student.batchId) {
      return res.status(404).json({
        message: "Student is not assigned to any batch",
      });
    }

    // Find the batch to get batchName
    const batch = await Batch.findOne({
      where: { batchId: student.batchId },
      attributes: ['batchName'],
      raw: true
    });

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    // Retrieve tests that match the student's batch name
    const studentTests = await Admintest.findAll({
      where: { batch_name: batch.batchName }
    });

    // Check if any tests exist for this batch
    if (studentTests.length === 0) {
      return res.status(404).json({
        message: "No tests found for your batch",
      });
    }

    // Send the retrieved test details as the response
    return res.status(200).json({
      message: "Test details fetched successfully",
      tests: studentTests,
    });
  } catch (error) {
    console.error("Error retrieving test details:", error);
    return res.status(500).json({
      message: "Failed to retrieve test details",
      error: error.message,
    });
  }
};

export const getTestDetailsById = async (req, res) => {
  try {
    const { testid } = req.body;

    if (!testid) {
      return res.status(400).json({
        message: "testid is required",
      });
    }

    const testDetails = await Admintest.findOne({
      where: { id: testid },
      attributes: [
        'id', 'testname', 'difficulty', 'subject', 'marks', 'positivemarks',
        'negativemarks', 'correctanswer', 'question_ids', 'unitName', 'topic_name',
        'no_of_questions', 'question_id', 'duration', 'exam_start_date', 'exam_end_date',
        'instruction', 'batch_name', 'status'
      ],
    });

    if (!testDetails) {
      return res.status(404).json({
        message: "Test not found",
      });
    }

    return res.status(200).json({
      message: "Test details fetched successfully",
      test: testDetails,
    });
  } catch (error) {
    console.error("Error retrieving test details:", error);
    return res.status(500).json({
      message: "Failed to retrieve test details",
      error: error.message,
    });
  }
};


export const getTestQuestionsWithAnswers = async (req, res) => {
  try {
    const { testid } = req.body;

    if (!testid) {
      return res.status(400).json({ message: "testid is required" });
    }

    // 1. Get the test and question_ids field
    const test = await Admintest.findOne({
      where: { id: testid },
      attributes: ["question_ids"],
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    let questionMapping = test.question_ids;

    // 2. Parse if it's a JSON string
    if (typeof questionMapping === "string") {
      try {
        questionMapping = JSON.parse(questionMapping);
      } catch (err) {
        return res.status(500).json({
          message: "Failed to parse question_ids JSON",
          error: err.message,
        });
      }
    }

    // 3. Validate format
    if (!Array.isArray(questionMapping)) {
      return res.status(500).json({ message: "Invalid question_ids format" });
    }

    const response = [];

    // 4. Loop over subject → ids
    for (const { subject, ids } of questionMapping) {
      if (!Array.isArray(ids) || ids.length === 0) continue;

      // ✅ Ensure we match IDs correctly
      const questions = await Question.findAll({
        where: { id: ids },
        include: [{ model: Option, as: "options" }],
      });

      for (const question of questions) {
        const options = question.options.map((opt) => opt.option_text);
        const correctOption = question.options.find((opt) => opt.is_correct);

        response.push({
          subject,
          question_text: question.question_text || question.question || "", // fallback just in case
          options,
          correctanswer: correctOption ? correctOption.option_text : null,
        });
      }
    }

    if (response.length === 0) {
      return res.status(404).json({ message: "No questions found for given testid" });
    }

    return res.status(200).json({
      message: "Questions fetched successfully",
      data: response,
    });
  } catch (error) {
    console.error("Error in getTestQuestionsWithAnswers:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//submit test of generatetestresult from student
export const saveGenerateTestResult = async (req, res) => {
  try {
    const {
      studentId,
      testid,
      testname,
      selectedChapters,
      answers,
      score,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      totalquestions,
      overallmarks,
      subjectWiseMarks,
    } = req.body;

    const newResult = await generateTestResult.create({
      studentId,
      testid,
      testname,
      selectedChapters,
      answers,
      score,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      totalquestions,
      overallmarks,
      subjectWiseMarks,
    });

    res.status(201).json({
      message: "Test result saved successfully.",
      data: newResult,
    });
  } catch (error) {
    console.error("Error saving test result:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


//updating the data from the req.boy
const updateTest = async (req, res) => {
  try {
    const {
      testid,
      testname,
      batch_name,
      duration,
      exam_start_date,
      exam_end_date,
      status,
    } = req.body; // Extract the editable fields from the request body

    // Ensure testid is provided in the request body
    if (!testid) {
      return res.status(400).json({ message: "Test ID is required" });
    }

    // Find the test by ID
    const testToUpdate = await Admintest.findOne({ where: { id: Number(testid) } });

    if (!testToUpdate) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Only update the provided fields, keep the rest as is
    testToUpdate.testname = testname || testToUpdate.testname;
    testToUpdate.batch_name = batch_name || testToUpdate.batch_name;
    testToUpdate.duration = duration || testToUpdate.duration;
    testToUpdate.exam_start_date = exam_start_date || testToUpdate.exam_start_date;
    testToUpdate.exam_end_date = exam_end_date || testToUpdate.exam_end_date;
    testToUpdate.status = status || testToUpdate.status;

    // Save the changes to the database
    await testToUpdate.save();

    // Send success response
    res.status(200).json({ message: "Test updated successfully", test: testToUpdate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//getting students, batches, and tests created by user

const dashboardDetails = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    // Count students added by admin
    const studentCount = await Student.count({
      where: { addedByAdminId: adminId },
    });

    // Count batches created by admin
    const batchCount = await Batch.count({
      where: { admin_id: adminId },
    });

    // Count tests created by admin
    const testCount = await Admintest.count({
      where: { addedByAdminId: adminId },
    });

    return res.status(200).json({
      message: "Dashboard data fetched successfully",
      data: {
        totalStudents: studentCount,
        totalBatches: batchCount,
        totalTests: testCount,
      },
    });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
};




//dashboard data of student
const dashboardStudentData = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    const student = await Student.findOne({
      where: { id: studentId },
      attributes: ['firstName', 'lastName', 'emailAddress', 'mobileNumber', 'profileImage'],
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({
      message: "Student data fetched successfully",
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student data:", error);
    return res.status(500).json({
      message: "Error fetching student data",
      error: error.message,
    });
  }
};


//admin student dashboard
const getTestResults = async (req, res) => {
  try {
    const { studentId } = req.body; // Assuming studentId is sent in the request body

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    // Fetch the test result for the student from FullTestResults
    const testResults = await FullTestResults.findAll({
      where: { studentId },
      attributes: ['testName', 'totalMarks', 'marksObtained'], // Only select the necessary fields
    });

    // Fetch the test result for the student from MeTest
    const metestResults = await MeTest.findAll({
      where: { studentId },
      attributes: ['testName', 'totalQuestions', 'overAllMarks', 'subjectWiseMarks'],
    });

    // Calculate totalMarks for each test result in MeTest (totalQuestions * 4)
    const resultsWithTotalMarks = metestResults.map((result) => {
      const totalMarks = result.totalQuestions * 4;
      return {
        testName: result.testName,
        marksObtained: result.overAllMarks,
        totalMarks: totalMarks,
        subjectWiseMarks: JSON.parse(result.subjectWiseMarks), // Parsing the JSON string into an object
      };
    });

    // Initialize subject totals
    const subjectTotals = { Physics: 0, Chemistry: 0, Biology: 0 };

    // Iterate through each test result and accumulate subject marks
    resultsWithTotalMarks.forEach((result) => {
      const { subjectWiseMarks } = result;

      // Add marks for each subject
      subjectTotals.Physics += subjectWiseMarks.Physics || 0;
      subjectTotals.Chemistry += subjectWiseMarks.Chemistry || 0;
      subjectTotals.Biology += subjectWiseMarks.Biology || 0;
    });

    // Get the count of test results
    const fullTestCount = testResults.length;
    const meTestCount = metestResults.length;

    // Return the test results along with counts and subject totals
    return res.status(200).json({
      message: "Test results fetched successfully",
      data: {
        fullTestCount,
        meTestCount,
        fullTestResults: testResults,
        resultsWithTotalMarks,
        subjectTotals,
      },
    });
  } catch (error) {
    console.error("Error fetching test results:", error);
    return res.status(500).json({
      message: "Error fetching test results",
      error: error.message,
    });
  }
};


const getProfile = async (req, res) => {
  try {
    const adminId = req.adminId;// Decode the JWT token to get the admin ID

    if (!adminId) {
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }

    const admin = await Admin.findOne({ where: { id: adminId } });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    console.log(admin);
    return res.status(200).json({
      message: "Admin profile fetched successfully",
      data: {
        id: admin.id,
        adminId: admin.AdminId,
        name: admin.name,
        email: admin.Email, // ✅ fixed casing: Email → email
        mobileNumber: admin.mobileNumber,
        whatsappNumber: admin.whatsappNumber,
        startDate: admin.StartDate, // ✅ fixed casing: StartDate → startDate
        expiryDate: admin.ExpiryDate,
        address: admin.address,
        hodName: admin.HodName,
      },
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }
    // Decode the JWT token to get the admin ID
    const admin = await Admin.findOne({ where: { id: adminId } });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Allowed fields to update (excluding id, adminId, StartDate, ExpiryDate)
    const {
      name,
      Email,
      mobileNumber,
      whatsappNumber,
      address,
      HodName,
    } = req.body;

    // Update only allowed fields
    if (name) admin.name = name;
    if (Email) admin.Email = Email;
    if (mobileNumber) admin.mobileNumber = mobileNumber;
    if (whatsappNumber) admin.whatsappNumber = whatsappNumber;
    if (address) admin.address = address;
    if (HodName) admin.HodName = HodName;

    await admin.save();

    return res.status(200).json({
      message: "Admin profile updated successfully",
      data: {
        id: admin.id,
        adminId: admin.AdminId,
        name: admin.name,
        email: admin.Email,
        mobileNumber: admin.mobileNumber,
        whatsappNumber: admin.whatsappNumber,
        startDate: admin.StartDate,       // returned but not updated
        expiryDate: admin.ExpiryDate,     // returned but not updated
        address: admin.address,
        hodName: admin.HodName,
      },
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getTestData = async (req, res) => {
  try {
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(400).json({ success: false, message: "Admin ID is required" });
    }


    const tests = await Admintest.findAll({
      where: {
        addedByAdminId: adminId, // Use the adminId from the decoded token
      },
      order: [['createdAt', 'DESC']] // Optional: latest first
    });

    if (!tests || tests.length === 0) {
      return res.status(404).json({ message: "No test data found" });
    }

    return res.status(200).json({
      message: "Test data fetched successfully",
      data: tests
    });
  } catch (error) {
    console.error("Error fetching test data:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

const getUpcomingTestByBatch = async (req, res) => {
  try {
    // Get student ID from request (could be from params, body, or auth token)
    const studentId = req.adminId;

    if (!studentId) {
      return res.status(400).json({
        message: "Student ID is required",
      });
    }

    // Find the student to get their batchId
    const student = await Student.findOne({
      where: { id: studentId },
      attributes: ['batchId'],
      raw: true
    });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    if (!student.batchId) {
      return res.status(404).json({
        message: "Student is not assigned to any batch",
      });
    }

    // Find the batch to get batchName
    const batch = await Batch.findOne({
      where: { batchId: student.batchId },
      attributes: ['batchName'],
      raw: true
    });

    if (!batch) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    // Retrieve tests that match the student's batch name
    const studentTests = await Admintest.findAll({
      where: { batch_name: batch.batchName },
      attributes: ["id", "testname", "subject", "exam_start_date"]
    });

    // Check if any tests exist for this batch
    if (studentTests.length === 0) {
      return res.status(404).json({
        message: "No tests found for your batch",
      });
    }

    // Send the retrieved test details as the response
    return res.status(200).json({
      message: "Test details fetched successfully",
      tests: studentTests,
    });
  } catch (error) {
    console.error("Error retrieving test details:", error);
    return res.status(500).json({
      message: "Failed to retrieve test details",
      error: error.message,
    });
  }
};

export const getAdminColors = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Admin ID is required",
      });
    }

    // Find admin by AdminId
    const admin = await Admin.findOne({
      where: { id },
      attributes: ['navbarColor', 'sidebarColor', 'otherColor'], // Only fetch these fields
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      colors: {
        navbarColor: admin.navbarColor || '#ffffff', // Default to white if null
        sidebarColor: admin.sidebarColor || '#ffffff', // Default to white if null
        textColor: admin.otherColor || '#000000', // Default to black if null
      },
    });

  } catch (error) {
    console.error("Error fetching admin colors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin color settings",
      error: error.message,
    });
  }
};

export const getAdminColorsByStudentId = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Find the student by id and get addedByAdminId
    const student = await Student.findOne({
      where: { id: studentId },
      attributes: ['addedByAdminId'],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const adminId = student.addedByAdminId;
    if (!adminId) {
      return res.status(404).json({
        success: false,
        message: "Admin ID for the student not found",
      });
    }

    // Fetch the admin colors
    const admin = await Admin.findOne({
      where: { id: adminId },
      attributes: ['navbarColor', 'sidebarColor', 'otherColor'],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      colors: {
        navbarColor: admin.navbarColor || '#ffffff',
        sidebarColor: admin.sidebarColor || '#ffffff',
        textColor: admin.otherColor || '#000000',
      },
    });

  } catch (error) {
    console.error("Error fetching admin colors by student ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin color settings",
      error: error.message,
    });
  }
};


export { dashboardDetails, getTestbyAdminId, createAdmin, loginAdmin, updateTest, dashboardStudentData, getTestResults, getProfile, updateProfile, getTestData, getUpcomingTestByBatch };