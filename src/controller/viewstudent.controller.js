import Student from "../models/student.model.js";
import bcrypt from "bcrypt";
import { Batch } from "../models/admin.model.js";
import Sequelize from "sequelize";
import { StudentBatch } from "../models/ModelManager.js";
import { Op } from "sequelize";
import { sendWhatsAppMessage } from "../utils/sendWhatsapp.js";

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
        firstName: student.firstName,
        lastName: student.lastName,
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
      where: { batchId },
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

// Controller to save student information - NOW SENDS PASSWORD VIA WHATSAPP
const saveBasicStudentData = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      phoneNumber,
      gender,
      addedByAdminId,
    } = req.body;

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !phoneNumber ||
      !gender ||
      !addedByAdminId
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ where: { emailAddress: email } });
    if (existingStudent) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Check if mobile number already exists
    const existingPhone = await Student.findOne({ where: { mobileNumber: phoneNumber } });
    if (existingPhone) {
      return res.status(409).json({ message: "Mobile number already registered" });
    }

    // Store original password to send via WhatsApp
    const originalPassword = String(password).trim();

    // Hash password for database
    console.log("Original password:", originalPassword);
    const hashedPassword = await bcrypt.hash(originalPassword, 10);
    console.log("Hashed password:", hashedPassword);

    const newStudent = await Student.create({
      emailAddress: email,
      password: hashedPassword,
      firstName,
      middleName: middleName || null,
      lastName,
      dateOfBirth,
      mobileNumber: phoneNumber,
      gender,
      addedByAdminId,
      isVerified: true, // Auto-verify since admin is creating
    });

    // ✅ SEND LOGIN CREDENTIALS VIA WHATSAPP - NO EMAIL
    try {
      const whatsappResult = await sendWhatsAppMessage(
        phoneNumber,
        `Welcome to *ExamPortal*, ${firstName}!

Your account has been created successfully.

*Login Credentials:*
📧 Email: ${email}
🔐 Password: ${originalPassword}

Please keep this information secure and change your password after first login.

You can now login to your account.

Thank you for joining *ExamPortal*!`
      );

      if (!whatsappResult) {
        console.error("⚠️ Failed to send credentials via WhatsApp");
        // Don't fail the request, but log the error
      } else {
        console.log("✅ Login credentials sent via WhatsApp to:", phoneNumber);
      }
    } catch (whatsappError) {
      console.error("❌ WhatsApp error:", whatsappError);
      // Continue even if WhatsApp fails
    }

    // Response without password
    const studentResponse = {
      id: newStudent.id,
      emailAddress: newStudent.emailAddress,
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      dateOfBirth: newStudent.dateOfBirth,
      mobileNumber: newStudent.mobileNumber,
      gender: newStudent.gender,
    };

    return res.status(201).json({
      message: "Student created successfully. Login credentials sent to WhatsApp.",
      student: studentResponse,
    });
  } catch (error) {
    console.error("❌ Error saving student data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteStudentById = async (req, res) => {
  try {
    const studentId = req.params.id || req.body.id;

    if (!studentId) {
      return res.status(400).json({
        message: "Student ID is required",
      });
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    await student.destroy();

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

// Bulk save students - NOW SENDS PASSWORDS VIA WHATSAPP
const bulkSaveStudents = async (req, res) => {
  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      console.error("Invalid students array:", students);
      return res.status(400).json({
        message: "Students array is required and must be a non-empty array",
      });
    }

    const studentData = [];
    const existingEmails = [];
    const existingPhones = [];
    const whatsappMessages = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const {
        emailAddress,
        password: providedPassword,
        firstName,
        lastName,
        dateOfBirth,
        mobileNumber,
        gender,
        addedByAdminId,
      } = student;

      // Validate required fields
      if (!emailAddress) {
        console.error(`Missing emailAddress for student at index ${i + 1}:`, student);
        return res.status(400).json({
          message: `Missing EMAIL for student at index ${i + 1}`,
        });
      }
      if (!firstName) {
        console.error(`Missing firstName for student at index ${i + 1}:`, student);
        return res.status(400).json({
          message: `Missing FIRST NAME for student at index ${i + 1}`,
        });
      }
      if (!dateOfBirth) {
        console.error(`Missing dateOfBirth for student at index ${i + 1}:`, student);
        return res.status(400).json({
          message: `Missing DOB for student at index ${i + 1}`,
        });
      }
      if (!mobileNumber) {
        console.error(`Missing mobileNumber for student at index ${i + 1}:`, student);
        return res.status(400).json({
          message: `Missing PHONE NUMBER for student at index ${i + 1}`,
        });
      }
      if (!gender) {
        console.error(`Missing gender for student at index ${i + 1}:`, student);
        return res.status(400).json({
          message: `Missing GENDER for student at index ${i + 1}`,
        });
      }
      if (!addedByAdminId) {
        console.error(`Missing addedByAdminId for student at index ${i + 1}:`, student);
        return res.status(400).json({
          message: `Missing addedByAdminId for student at index ${i + 1}`,
        });
      }

      // Validate email format
      const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
      if (!emailRegex.test(emailAddress)) {
        console.error(`Invalid email format for student at index ${i + 1}:`, emailAddress);
        return res.status(400).json({
          message: `Invalid EMAIL format for student at index ${i + 1}: ${emailAddress}`,
        });
      }

      // Validate mobile number
      if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
        console.error(`Invalid mobile number for student at index ${i + 1}:`, mobileNumber);
        return res.status(400).json({
          message: `Invalid PHONE NUMBER for student at index ${i + 1}: ${mobileNumber}. Must be 10 digits starting with 6-9.`,
        });
      }

      // Check for duplicates
      const existingStudent = await Student.findOne({
        where: { emailAddress },
      });
      if (existingStudent) {
        existingEmails.push(emailAddress);
        continue;
      }

      const existingPhone = await Student.findOne({
        where: { mobileNumber },
      });
      if (existingPhone) {
        existingPhones.push(mobileNumber);
        continue;
      }

      // Generate password if not provided
      const birthYear = new Date(dateOfBirth).getFullYear();
      const originalPassword = providedPassword || `${firstName.charAt(0).toUpperCase()}${birthYear}${Math.floor(1000 + Math.random() * 9000)}`;

      // Hash password
      const hashedPassword = await bcrypt.hash(originalPassword, 10);

      // Prepare student data
      studentData.push({
        emailAddress,
        password: hashedPassword,
        firstName,
        lastName: lastName || null,
        dateOfBirth,
        mobileNumber,
        gender,
        addedByAdminId,
        isVerified: true,
        batchId: null,
        examType: null,
        studentClass: null,
        targetYear: null,
        fullName: `${firstName} ${lastName || ""}`.trim() || null,
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

      // Prepare WhatsApp message
      whatsappMessages.push({
        phone: mobileNumber,
        message: `Welcome to *Neet-720*, ${firstName}!

Your account has been created successfully.

*Login Credentials:*
📧 Email: ${emailAddress}
🔐 Password: ${originalPassword}

Please keep this information secure and change your password after first login.

You can now login to your account.

Thank you for joining *ExamPortal*!`,
      });
    }

    if (studentData.length > 0) {
      // Save students to database
      const savedStudents = await Student.bulkCreate(studentData);

      // Send WhatsApp messages
      const whatsappResults = await Promise.allSettled(
        whatsappMessages.map((msg) => sendWhatsAppMessage(msg.phone, msg.message))
      );

      const successfulWhatsApp = whatsappResults.filter(
        (result) => result.status === "fulfilled" && result.value
      ).length;

      console.log(
        `✅ Sent login credentials via WhatsApp to ${successfulWhatsApp}/${whatsappMessages.length} students`
      );

      // Trim savedStudents for response
      const savedStudentsTrimmed = savedStudents.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        emailAddress: s.emailAddress,
        mobileNumber: s.mobileNumber,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth,
      }));

      // Prepare response message
      let responseMessage = `${savedStudents.length} student(s) added successfully. Login credentials sent via WhatsApp.`;

      if (existingEmails.length > 0) {
        responseMessage += ` ${existingEmails.length} email(s) already exist.`;
      }

      if (existingPhones.length > 0) {
        responseMessage += ` ${existingPhones.length} phone number(s) already exist.`;
      }

      return res.status(201).json({
        message: responseMessage,
        savedCount: savedStudents.length,
        whatsappSentCount: successfulWhatsApp,
        existingEmails,
        existingPhones,
        savedStudents: savedStudentsTrimmed,
      });
    } else {
      return res.status(400).json({
        message: "No valid students to add",
        existingEmails,
        existingPhones,
      });
    }
  } catch (error) {
    console.error("❌ Error saving student data:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// controller to update batchId for multiple students based on emails
const updateBatchIdForUsers = async (req, res) => {
  try {
    const { emails, batchId } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res
        .status(400)
        .json({ message: "Emails are required and should be an array" });
    }

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    const [affectedCount] = await Student.update(
      { batchId },
      {
        where: {
          emailAddress: emails,
        },
      }
    );

    if (affectedCount === 0) {
      return res
        .status(404)
        .json({ message: "No students found with the provided emails" });
    }

    const updatedStudents = await Student.findAll({
      where: { emailAddress: emails },
      attributes: ["id", "emailAddress", "firstName", "lastName", "batchId"],
    });

    return res.status(200).json({
      message: `${affectedCount} student(s) updated successfully`,
      updatedStudents,
    });
  } catch (error) {
    console.error("Error updating batchId:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateStudentData = async (req, res) => {
  try {
    const {
      id,
      firstName,
      lastName,
      emailAddress,
      dateOfBirth,
      mobileNumber,
      gender,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Student ID is required" });
    }
    
    if (
      !firstName ||
      !lastName ||
      !emailAddress ||
      !dateOfBirth ||
      !mobileNumber ||
      !gender
    ) {
      return res.status(400).json({
        message:
          "All fields (firstName, lastName, emailAddress, dateOfBirth, mobileNumber, gender) are required",
      });
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    }

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if email is being changed and if new email exists
    if (emailAddress !== student.emailAddress) {
      const existingEmail = await Student.findOne({
        where: { emailAddress, id: { [Op.ne]: id } },
      });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }
    }

    // Check if phone is being changed and if new phone exists
    if (mobileNumber !== student.mobileNumber) {
      const existingPhone = await Student.findOne({
        where: { mobileNumber, id: { [Op.ne]: id } },
      });
      if (existingPhone) {
        return res.status(409).json({ message: "Mobile number already exists" });
      }
    }

    student.firstName = firstName;
    student.lastName = lastName;
    student.emailAddress = emailAddress;
    student.dateOfBirth = dateOfBirth;
    student.mobileNumber = mobileNumber;
    student.gender = gender;

    await student.save();

    return res.status(200).json({
      message: "Student updated successfully",
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        emailAddress: student.emailAddress,
        dateOfBirth: student.dateOfBirth,
        mobileNumber: student.mobileNumber,
        gender: student.gender,
      },
    });
  } catch (error) {
    console.error("Error updating student data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

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

    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");

    const lastBatch = await Batch.findOne({
      where: { batchId: { [Op.like]: `BATCH-${year}-${month}-%` } },
      order: [["batchId", "DESC"]],
    });

    const sequenceNumber = lastBatch
      ? parseInt(lastBatch.batchId.split("-")[3]) + 1
      : 1;
    const batchId = `BATCH-${year}-${month}-${sequenceNumber.toString().padStart(3, "0")}`;

    const existingBatchById = await Batch.findOne({ where: { batchId } });
    if (existingBatchById) {
      return res.status(409).json({ message: "Batch ID already exists" });
    }

    const existingBatchByName = await Batch.findOne({
      where: { batchName, admin_id: adminId },
    });
    if (existingBatchByName) {
      return res
        .status(409)
        .json({ message: "You already have a batch with this name" });
    }

    const newBatch = await Batch.create({
      batchId,
      batchName,
      no_of_students,
      status,
      admin_id: adminId,
    });

    if (studentIds && studentIds.length > 0) {
      const students = await Student.findAll({
        where: { id: studentIds },
      });

      if (students.length !== studentIds.length) {
        return res
          .status(400)
          .json({ message: "One or more student IDs are invalid" });
      }

      const studentBatchAssociations = students.map((student) => ({
        studentId: student.id,
        batchId: newBatch.batchId,
      }));

      await StudentBatch.bulkCreate(studentBatchAssociations);
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

// Controller to update an existing batch
const updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { batchName, no_of_students, status, studentIds } = req.body;
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const batch = await Batch.findOne({
      where: { batchId, admin_id: adminId },
      include: {
        model: Student,
        through: { attributes: [] },
        as: "Students",
      },
    });

    if (!batch) {
      return res
        .status(404)
        .json({ message: "Batch not found or unauthorized" });
    }

    if (batchName !== undefined) batch.batchName = batchName;
    if (no_of_students !== undefined) batch.no_of_students = no_of_students;
    if (status !== undefined) batch.status = status;

    if (studentIds !== undefined) {
      const students = await Student.findAll({
        where: { id: studentIds },
      });

      if (students.length !== studentIds.length) {
        return res.status(400).json({
          message: "One or more student IDs are invalid",
          invalidIds: studentIds.filter(
            (id) => !students.some((s) => s.id === id)
          ),
        });
      }

      const currentStudentIds = batch.Students.map((student) => student.id);

      const studentsToAdd = studentIds.filter(
        (id) => !currentStudentIds.includes(id)
      );

      const studentsToRemove = currentStudentIds.filter(
        (id) => !studentIds.includes(id)
      );

      if (studentsToAdd.length > 0) {
        const newStudents = students.filter((student) =>
          studentsToAdd.includes(student.id)
        );
        await batch.addStudents(newStudents);
      }

      if (studentsToRemove.length > 0) {
        await batch.removeStudents(studentsToRemove);
      }

      if (no_of_students === undefined) {
        batch.no_of_students = studentIds.length;
      }
    }

    await batch.save();

    const updatedBatch = await Batch.findOne({
      where: { batchId },
      include: {
        model: Student,
        through: { attributes: [] },
        as: "Students",
      },
    });

    res.status(200).json({
      message: "Batch updated successfully",
      batch: updatedBatch,
    });
  } catch (error) {
    console.error("Error updating batch:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//controller to delete the batches from the batches table
const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const batch = await Batch.findOne({
      where: { batchId, admin_id: adminId },
    });

    if (!batch) {
      return res
        .status(404)
        .json({ message: "Batch not found or unauthorized" });
    }

    await batch.setStudents([]);
    await batch.destroy();

    res.status(200).json({ message: "Batch deleted successfully" });
  } catch (error) {
    console.error("Error deleting batch:", error);
    res
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

//get batch names
const getBatchNames = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required." });
    }

    const batchData = await Batch.findAll({
      where: { admin_id: adminId },
      attributes: ["batch_id", "batchName"],
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
    const adminId = req.adminId;
    if (!adminId) {
      return res.status(400).json({
        message: "Admin ID is required",
      });
    }

    const batchData = await Batch.findAll({
      attributes: ["batchId", "batchName", "no_of_students"],
      where: {
        admin_id: req.adminId,
      },
    });

    if (batchData.length === 0) {
      return res.status(404).json({
        message: "No batches found",
      });
    }

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
  updateStudentData,
};