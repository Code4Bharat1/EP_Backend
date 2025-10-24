import {Admin, Batch} from '../models/admin.model.js'
import XLSX from "xlsx";
import multer from "multer";
import fs from "fs";
import Student from "../models/student.model.js";
import { generateRandomPassword,generateRandomPasswordofStudent, generateRandomUserId } from "../middleware/generateCredential.js";
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken"
import {sendEmail} from "../service/nodeMailerConfig.js";
import { Op } from "sequelize";


const createAdmin = async (req, res) => {
  try {
      const { name, Email, mobileNumber, whatsappNumber, address, HodName } = req.body;

      // Basic validation
      if (!name || !Email || !mobileNumber) {
          return res.status(400).json({ message: "Name, Email, and Mobile Number are required." });
      }

      // Check if an admin with the same email already exists
      const existingAdmin = await Admin.findOne({ where: { Email } });
      if (existingAdmin) {
          return res.status(400).json({ message: "Admin with this email already exists." });
      }

      // Create new admin entry
      const newAdmin = await Admin.create({
          name,
          Email,
          mobileNumber,
          whatsappNumber,
          address,
          HodName,
      });

      const emailSubject = "Welcome to Our Neet 720!";
      const emailText = `Dear ${name},\n\nYour Application has been submitted successfully.\n\nOnce your account get verified you will get your creedentials at your mail\n\nBest Regards,\nNeet 720 Team`;
  
      const emailHtml = `
        <p>Dear <strong>${name}</strong>,</p>
        <p>Welcome to our Neet 720! Your account form submit request  has been created successfully.</p>
        
        <p>Wait for your application to be approved</p>
        <p>Best Regards,<br>Neet 720 Team</p>
      `;
  
      await sendEmail(Email, emailSubject, emailText, emailHtml);

      return res.status(201).json({ message: "Admin registered successfully", admin: newAdmin });
  } catch (error) {
      console.error("Error creating admin:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};



const login = async (req, res) => {
  const { AdminId, PassKey } = req.body;

  if (!AdminId || !PassKey) {
    return res.status(400).json({ message: "AdminId and PassKey are required" });
  }

  try {
    // Fetch admin from the database
    const admin = await Admin.findOne({ where: { AdminId } });

    if (!admin) {
      console.error("Admin not found");
      return res.status(404).json({ message: "Admin not found" });
    }

    // Compare the entered password with the stored hashed password
    const isMatch = await bcrypt.compare(PassKey, admin.PassKey);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // // Generate JWT Token
    // const token = jwt.sign(
    //   { id: admin.id, AdminId: admin.AdminId },
    //   process.env.JWT_SECRET || "your_secret_key",
    //   { expiresIn: "1h" } 
    // );

    return res.status(200).json({
      message: "Login successful",
      token, // Send JWT token
      admin: {
        AdminId: admin.AdminId,
        name: admin.name,
        email: admin.Email,
      },
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    return res.status(500).json({ message: "Server error during login" });
  }
};


const generateCredential = async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne({ where: { Email: req.body.Email } });

    if (!existingAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    let adminId = existingAdmin.AdminId;
    if (!adminId) {
      adminId = generateRandomUserId(existingAdmin.name);
    }

    const newPassword = generateRandomPassword();

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await existingAdmin.update({
      AdminId: adminId,
      PassKey: hashedPassword,
      credentials: "generated",
    });

    // Send email with new temporary password
    const emailSubject = "Updated Admin Credentials";
    const emailText = `Dear ${existingAdmin.name},\n\nYour credentials have been updated. Please find the details below:\n\nAdmin ID: ${adminId}\nTemporary Password: ${newPassword}\n\nIMPORTANT: This is a temporary password. Please log in and change your password as soon as possible to ensure the security of your account.\n\nThank you!`;
    const emailHtml = `<p>Dear ${existingAdmin.name},</p>
                       <p>Your credentials have been updated. Please find the details below:</p>
                       <ul>
                         <li><strong>Admin ID:</strong> ${adminId}</li>
                         <li><strong>Temporary Password:</strong> ${newPassword}</li>
                       </ul>
                       <p><strong>IMPORTANT:</strong> This is a temporary password. Please log in and change your password as soon as possible to ensure the security of your account.</p>
                       <p>Thank you!</p>`;

    await sendEmail(existingAdmin.Email, emailSubject, emailText, emailHtml);

    res.status(200).json({
      message: "Credentials updated successfully. Email has been sent.",
      adminId: adminId,
      password: newPassword, 
    });
  } catch (error) {
    console.error(error); 
    res.status(500).json({
      message: "Error updating credentials",
      error: error.message,
    });
  }
};




const getList = async (req, res) => {
  try {
    const adminList = await Admin.findAll({
      where: {
        credentials: {
          [Op.like]: "pending", // Case-insensitive match for "pending"
        },
      },
    });


    res.status(200).json({
      message: "Admin list fetched successfully",
      data: adminList,
    });
  } catch (error) {
    console.error("Error fetching admin list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin list",
      error: error.message,
    });
  }
};




const getApprovedList = async (req, res)=> {
  try {
    const adminList = await Admin.findAll({
      where: {
        credentials: {
          [Op.like]: "generated", // Case-insensitive match for "pending"
        },
      },
    });


    res.status(200).json({
      message: "Admin list fetched successfully",
      data: adminList,
    });
  } catch (error) {
    console.error("Error fetching admin list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin list",
      error: error.message,
    });
  }
};



const studentsList = async (req, res) => {
  try {
    const { addedByAdminId } = req.query;

    if (!addedByAdminId) {
      return res.status(400).json({ message: "addedByAdminId is required." });
    }

    // Fetch students where addedByAdminId matches
    const students = await Student.findAll({
      where: { addedByAdminId },
      order: [["createdAt", "DESC"]],
    });

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found for this admin." });
    }

    res.status(200).json({
      message: "Students fetched successfully.",
      students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      message: "An error occurred while fetching students.",
      error: error.message,
    });
  }
};



const addStudent = async (req, res) => {
  const {
    firstName,
    lastName,
    emailAddress,
    mobileNumber,
    gender,
    dateOfBirth,
    addedByAdminId,
    batchId
  } = req.body;

  // Validate input
  if (!emailAddress || !mobileNumber  || !addedByAdminId || !batchId) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  try {
    // Check if email already exists
    const existingStudent = await Student.findOne({ where: { emailAddress } });
    if (existingStudent) {
      return res.status(400).json({ message: "Student with this email already exists" });
    }

    // Generate a random password if not provided
    const unhashedPassword =  generateRandomPasswordofStudent();

    // Hash password
    const hashedPassword = await bcrypt.hash(unhashedPassword, 10);

    // Create a new student
    const newStudent = await Student.create({
      firstName,
      lastName,
      emailAddress,
      mobileNumber,
      gender,
      dateOfBirth,
      password: hashedPassword,
      addedByAdminId, 
      batchId,
      status: "active",
    });

    // Send Email with credentials
    const emailSubject = "Welcome to Our Neet 720!";
    const emailText = `Dear ${firstName},\n\nWelcome to our Neet 720! Your account has been created successfully.\n\nHere are your login credentials:\n\nEmail: ${emailAddress}\nPassword: ${unhashedPassword}\n\nPlease log in and change your password for security purposes.\n\nBest Regards,\nNeet 720 Team`;

    const emailHtml = `
      <p>Dear <strong>${firstName}</strong>,</p>
      <p>Welcome to our Neet 720! Your account has been created successfully.</p>
      <p><strong>Here are your login credentials:</strong></p>
      <ul>
        <li><strong>Email:</strong> ${emailAddress}</li>
        <li><strong>Password:</strong> ${unhashedPassword}</li>
      </ul>
      <p>Please log in and change your password for security purposes.</p>
      <p>Best Regards,<br>Neet 720 Team</p>
    `;

    await sendEmail(emailAddress, emailSubject, emailText, emailHtml);

    return res.status(201).json({
      message: "Student added successfully, and email sent with login details.",
      student: {
        id: newStudent.id,
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        emailAddress: newStudent.emailAddress,
        mobileNumber: newStudent.mobileNumber,
        gender: newStudent.gender,
        dateOfBirth: newStudent.dateOfBirth,
        addedByAdminId: newStudent.addedByAdminId,
        batchId:newStudent.batchId,
      },
    });
  } catch (error) {
    console.error("Error adding student:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};






const viewStudent = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid student ID provided." });
  }

  try {
    const student = await Student.findByPk(id, {
      attributes: { exclude: ['password'] }, 
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    return res.status(200).json({
      message: "Student retrieved successfully.",
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        emailAddress: student.emailAddress,
        mobileNumber: student.mobileNumber,
        gender: student.gender,
        batchId:student.batchId,
        dateOfBirth: student.dateOfBirth,
        status: student.status,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};


const deleteStudents = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid student ID provided." });
  }

  try {
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    await student.destroy();

    return res.status(200).json({
      message: "Student deleted successfully.",
      studentId: id,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};



const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Ensure this folder exists
    },
    filename: (req, file, cb) => {
      cb(null, `students_${Date.now()}.xlsx`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed!"), false);
    }
  },
}).single("file"); // Single file upload under key "file"

// Bulk Student Upload Controller
const bulkStudentUpload = async (req, res) => {
  // Handle file upload dynamically with Multer
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please upload an Excel file." });
      }

      // Read uploaded file
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0]; // Read first sheet
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (sheetData.length === 0) {
        return res.status(400).json({ message: "Excel file is empty." });
      }

      const studentsToInsert = [];
      const emailErrors = [];
      const emailsSent = [];

      // Process each row in Excel
      for (const row of sheetData) {
        const {
          firstName,
          lastName,
          emailAddress,
          mobileNumber,
          gender,
          dateOfBirth,
          addedByAdminId,
        } = row;

        // Validate required fields
        if (!emailAddress || !mobileNumber || !gender || !dateOfBirth || !addedByAdminId) {
          emailErrors.push({ email: emailAddress, error: "Missing required fields" });
          continue; // Skip invalid entries
        }

        // Check if email already exists
        const existingStudent = await Student.findOne({ where: { emailAddress } });
        if (existingStudent) {
          emailErrors.push({ email: emailAddress, error: "Student already exists" });
          continue;
        }

        // Generate a random password
        const unhashedPassword = generateRandomPasswordofStudent();
        const hashedPassword = await bcrypt.hash(unhashedPassword, 10);

        // Prepare student object for bulk insert
        studentsToInsert.push({
          firstName,
          lastName,
          emailAddress,
          mobileNumber,
          gender,
          dateOfBirth,
          password: hashedPassword,
          addedByAdminId,
          status: "active",
        });

        // Send email notification
        const emailSubject = "Welcome to Our Neet 720!";
        const emailText = `Dear ${firstName},\n\nWelcome to our Neet 720! Your account has been created successfully.\n\nHere are your login credentials:\n\nEmail: ${emailAddress}\nPassword: ${unhashedPassword}\n\nPlease log in and change your password for security purposes.\n\nBest Regards,\nNeet 720 Team`;

        const emailHtml = `
          <p>Dear <strong>${firstName}</strong>,</p>
          <p>Welcome to our Neet 720! Your account has been created successfully.</p>
          <p><strong>Here are your login credentials:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${emailAddress}</li>
            <li><strong>Password:</strong> ${unhashedPassword}</li>
          </ul>
          <p>Please log in and change your password for security purposes.</p>
          <p>Best Regards,<br>Neet 720 Team</p>
        `;

        try {
          await sendEmail(emailAddress, emailSubject, emailText, emailHtml);
          emailsSent.push(emailAddress);
        } catch (error) {
          emailErrors.push({ email: emailAddress, error: "Email sending failed" });
        }
      }

      // Insert all students in bulk
      if (studentsToInsert.length > 0) {
        await Student.bulkCreate(studentsToInsert);
      }

      // Delete uploaded file after processing
      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        message: "Bulk student upload completed.",
        successCount: studentsToInsert.length,
        failedEmails: emailErrors,
        emailsSent: emailsSent,
      });
    } catch (error) {
      console.error("Error during bulk upload:", error);
      return res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
};



const addBatch = async(req, res)=> {
   const {
  batchId,
  batchName,
  no_of_students,
} = req.body;

try {
  if (!batchId || !batchName || !no_of_students ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }
  

  const existingbatchId = await Batch.findOne({ where: { batchId } });
  if (existingbatchId) {
    return res.status(400).json({ message: "batchId already exists" });
  }

  const newBatch = await Batch.create({
    batchId,
    batchName,
    no_of_students,
  });

  return res.status(201).json({
    message: "Batch added successfully",
    batch: newBatch
  });
} catch (error) {
  console.error("Error adding student:", error);
  return res.status(500).json({ message: "Internal server error", error: error.message });
}};



const viewBatch = async(req, res)=> {
  const { batchId } = req.params;
  if (!batchId || isNaN(batchId)) {
    return res.status(400).json({ message: "Invalid student ID provided." });
  }
  try {
    const batch = await Batch.findByPk(batchId);

    if (!batch) {
      return res.status(404).json({ message: "batch not found." });
    }

    return res.status(200).json({
      message: "Student retrieved successfully.",
      batch: {
        batchId: batch.batchId,
        no_of_students: batch.no_of_students,
        batchName: batch.batchName,
      },
    });
  } catch (error) {
    console.error("Error fetching batch:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};



const editBatch = async (req, res) => {
  const { batchId } = req.params;
  const { batchName, no_of_students } = req.body;

  try {
    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    const batch = await Batch.findOne({ where: { batchId } });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    await batch.update({
      batchName: batchName || batch.batchName,
      no_of_students: no_of_students || batch.no_of_students,
    });

    return res.status(200).json({
      message: "Batch updated successfully",
      batch,
    });
  } catch (error) {
    console.error("Error updating batch:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const getAllBatch = async (req, res) => {
  try {
    const batches = await Batch.findAll();

    if (batches.length === 0) {
      return res.status(404).json({ message: "No batches found" });
    }

    return res.status(200).json({
      message: "Batches retrieved successfully",
      batches,
    });
  } catch (error) {
    console.error("Error fetching batches:", error.message);
    return res.status(500).json({ message: "Server error while retrieving batches" });
  }
};


const getBatchListbyId = async (req, res) => {
  try {
    const batches = await Batch.findAll({
      attributes: ["batch_id", "batch_name"],
    });

    if (!batches.length) {
      return res.status(404).json({ message: "No batches found" });
    }

    return res.status(200).json({
      message: "Batches retrieved successfully",
      batches,
    });
  } catch (error) {
    console.error("Error fetching batches:", error.message);
    return res.status(500).json({ message: "Server error while retrieving batches" });
  }
};


const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    const batch = await Batch.findOne({ where: { batchId } });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    await batch.destroy();

    return res.status(200).json({ message: "Batch deleted successfully" });

  } catch (error) {
    console.error("Error deleting batch:", error.message);
    return res.status(500).json({ message: "Server error while deleting batch" });
  }
};


const getBatchNames = async(req, res) => {
  try{

    const {admin_id} = req.body;

    if(!admin_id) {
      return res.status(400).json({
        message : 'admin id is not provided.'
      })
    }

      const batches = await Batch.findAll({
        where : {admin_id},
        attributes : ['batchName']
      })
      

      if(batches.length === 0) {
        return res.status(404).json({
          message : 'No batches for this admin'
        })
      }

      const batchesName = batches.map((batch)=> batch.batchName);
      console.log(batchesName);
      
      return res.status(200).json({batchesName})
    
  }catch(error){
    console.error("Error getting the batch names", error);
    return res.status(500).json({
      message : "Internal Server Error"
    })
  }
}


export {createAdmin, getBatchNames, getBatchListbyId, login,getApprovedList,generateCredential,getList ,studentsList,addStudent,viewStudent, deleteStudents,bulkStudentUpload,addBatch,viewBatch, editBatch, getAllBatch ,deleteBatch };
