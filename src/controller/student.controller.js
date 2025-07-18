import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "config";
import Student from "../models/student.model.js";
import { sendEmail } from "../service/nodeMailerConfig.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
let otpStore = {};

//register
const register = async (req, res) => {
  try {
    const { name, emailAddress, password, confirmPassword } = req.body;
    if (!name || !emailAddress || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Name, email, password, and confirm password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailAddress)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password match check
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user already exists
    const existingStudent = await Student.findOne({ where: { emailAddress } });
    if (existingStudent) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate a random 4-digit OTP
    const otp = crypto.randomInt(1000, 9999).toString();
    console.log("otp", otp);
    
    const expirationTime = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Store OTP in the in-memory store (or use a database for production)
    otpStore[emailAddress] = { otp, expirationTime };

    // Create the new student in DB with isVerified=false
    await Student.create({
      name,
      emailAddress,
      password, // Plain password, will be hashed automatically in model
      isVerified: false, // Verification will happen later with OTP
    });

    // Send OTP via email
    await sendEmail(
      emailAddress,
      "Your OTP Code for ExamPortal Registration",
      `Your OTP is ${otp}. It expires in 10 minutes.`,
      `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`
    );
    console.log("SMTP Details:", process.env.SMTP_HOST);
    return res.status(201).json({
      message: "Registration successful. OTP has been sent to your email.",
      expiresAt: new Date(expirationTime).toISOString(),
    });
  } catch (error) {
    console.error("Error in registerStudent:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const savePersonalData = async (req, res) => {
  try {
    console.log('Received body:', req.body);
    console.log('Received file:', req.file);

    const {
      firstName,
      lastName, 
      examType,
      dateOfBirth,
      domicileState,       
      targetYear,      
      mobileNumber,         
      gender,     
      emailAddress,        
      fullAddress
    } = req.body;

    console.log(firstName, lastName, examType, dateOfBirth, state, country, language, email, fullAddress);

    // Validate required fields
    if (!firstName || !lastName || !emailAddress) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const id = req.user.id;
    console.log(id);
    const student = await Student.findOne({ where: { id } });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let updatedProfileImage = student.profileImage;
    
    if (req.file) {
      try {
        const uploadedProfileImage = await uploadOnCloudinary(req.file.path);
        updatedProfileImage = uploadedProfileImage.url;
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return res.status(500).json({ message: "Error uploading profile image" });
      }
    }

    // Convert targetYear to number if needed
    const targetYearValue = country ? parseInt(country) : null;

    // Update with proper field mappings
    const updateData = {
      firstName,
      lastName,
      examType: examType || null,
      dateOfBirth: dateOfBirth || null,
      domicileState: domicileState || null,
      targetYear: targetYearValue,
      mobileNumber: mobileNumber || null,
      gender: gender || null,
      emailAddress: emailAddress,
      fullAddress: fullAddress || null,
      profileImage: updatedProfileImage
    };

    console.log('Updating with:', updateData);

    await student.update(updateData);

    return res.status(200).json({
      message: "Personal data updated successfully",
      student,
    });

  } catch (error) {
    console.error("Error saving personal data:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};


const newSavePersonalData = async (req, res) => {
  try {
    const {
      id,
      updatedImageUrl,
      firstName,
      lastName,
      examType,
      dateOfBirth,
      domicileState,
      targetYear,
      mobileNumber,
      gender,
      emailAddress,
      fullAddress,
    } = req.body;

    
    const student = await Student.findOne({ where: { id } });
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const updateData = {
      firstName: firstName || student.firstName,
      lastName: lastName || student.lastName,
      examType: examType || student.examType,
      dateOfBirth: dateOfBirth || student.dateOfBirth,
      domicileState: domicileState || student.domicileState,
      targetYear: targetYear || student.targetYear,
      mobileNumber : mobileNumber || student.mobileNumber,
      gender: gender || student.gender,
      emailAddress: emailAddress || student.emailAddress,
      fullAddress: fullAddress || student.fullAddress,
      profileImage: updatedImageUrl || student.profileImage, // Fixed variable name
    };

    await student.update(updateData);

    return res.status(200).json({
      message: "Personal Data Updated Successfully",
      student,
    });

  } catch (error) {
    console.error("Error saving personal Data: ", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// OTP Verification Controller
const verifyOtp = async (req, res) => {
  try {
    const { emailAddress, otp } = req.body;

    if (!emailAddress || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const storedOtpEntry = otpStore[emailAddress];
    if (!storedOtpEntry) {
      return res.status(400).json({ message: "No OTP found for this email" });
    }

    const { otp: storedOtp, expirationTime } = storedOtpEntry;

    // Check if OTP has expired
    if (Date.now() > expirationTime) {
      delete otpStore[emailAddress];
      return res
        .status(400)
        .json({ message: "OTP expired, please request a new one" });
    }

    // Verify OTP
    if (otp !== storedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP is valid; mark the student as verified
    const student = await Student.findOne({ where: { emailAddress } });
    if (!student) {
      return res.status(400).json({ message: "Student not found" });
    }

    if (student.isVerified) {
      return res.status(400).json({ message: "Student already verified" });
    }

    student.isVerified = true;
    await student.save();

    // Remove OTP from the store
    delete otpStore[emailAddress];

    const token = jwt.sign(
      { id: student.id, email: student.emailAddress },
      config.get("jwtSecret"),
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    return res.json({
      message: "OTP verified successfully. You can now log in.",
      token,
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Resend OTP Controller
const resendOtp = async (req, res) => {
  try {
    const { emailAddress } = req.body;

    if (!emailAddress) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const storedOtpEntry = otpStore[emailAddress];
    if (storedOtpEntry && Date.now() < storedOtpEntry.expirationTime) {
      return res
        .status(400)
        .json({ message: "OTP is still valid. Please check your email." });
    }

    const otp = crypto.randomInt(1000, 9999).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000;
    otpStore[emailAddress] = { otp, expirationTime };
    // Send OTP via email
    await sendEmail(
      emailAddress,
      "Your OTP Code for ExamPortal Registration",
      `Your new OTP is ${otp}. It expires in 10 minutes.`,
      `<p>Your new OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`
    );

    return res.status(200).json({ message: "New OTP sent successfully." });
  } catch (error) {
    console.error("Error in resendOtp:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;
    
console.log("Login", emailAddress, password);

    // Basic validation
    if (!emailAddress || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    // Find student in the database
    const student = await Student.findOne({ where: { emailAddress } });
    if (!student) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Log the entered password and the hashed password stored in the database
    // console.log("Entered Password:", password); // Log entered password
    // console.log("Stored Hashed Password:", student.password);
    // Compare the entered password with the hashed password
    console.log("Comparing passwords... :", password , student.password, student);
    const isPasswordValid = await bcrypt.compare(password, student?.password);


    console.log("Password Validation Result:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    // Check if the student is verified
    if (!student.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email before logging in" });
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: student.id, email: student.emailAddress },
      config.get("jwtSecret"),
      { expiresIn: "30d" }
    );
    return res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { emailAddress } = req.body;

    if (!emailAddress) {
      return res.status(400).json({ message: "Email address is required" });
    }
    const student = await Student.findOne({ where: { emailAddress } });
    if (!student) {
      return res
        .status(400)
        .json({ message: "No user found with this email address" });
    }

    // Generate OTP and expiration time
    const otp = crypto.randomInt(1000, 9999).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore[emailAddress] = { otp, expirationTime };

    await sendEmail(
      emailAddress,
      "Your OTP for Password Reset",
      `Your OTP for resetting your password is ${otp}. It expires in 10 minutes.`,
      `<p>Your OTP for resetting your password is <b>${otp}</b>. It expires in 10 minutes.</p>`
    );

    return res
      .status(200)
      .json({ message: "OTP sent to your email for password reset" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password Controller
const resetPassword = async (req, res) => {
  try {
    const { emailAddress, otp, newPassword } = req.body;

    if (!emailAddress || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
    }

    const storedOtpEntry = otpStore[emailAddress];
    if (!storedOtpEntry) {
      return res
        .status(400)
        .json({ message: "No OTP found for this email address" });
    }

    const { otp: storedOtp, expirationTime } = storedOtpEntry;

    if (Date.now() > expirationTime) {
      delete otpStore[emailAddress];
      return res
        .status(400)
        .json({ message: "OTP expired, please request a new one" });
    }

    if (otp !== storedOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const student = await Student.findOne({ where: { emailAddress } });
    if (!student) {
      return res.status(400).json({ message: "Student not found" });
    }

    student.password = hashedPassword;
    await student.save();

    delete otpStore[emailAddress];

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getPersonalData = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await Student.findOne({
      where: { id: studentId },
      attributes: [
        "firstName",
        "lastName",
        "emailAddress",
        "examType",
        "studentClass",
        "targetYear",
        "fullName",
        "dateOfBirth",
        "gender",
        "mobileNumber",
        "fullAddress",
        "domicileState",
        "parentName",
        "parentContactNumber",
        "relationToStudent",
        "tenthBoard",
        "tenthYearOfPassing",
        "tenthPercentage",
        "eleventhYearOfCompletion",
        "eleventhpercentage",
        "twelfthBoard",
        "twelfthYearofPassing",
        "twelfthPercentage",
        "hasAppearedForNEET",
        "neetAttempts",
        "targetMarks",
        "hasTargetFlexibility",
        "deferredColleges",
        "PreferredCourses",
        "CoachingInstituteName",
        "studyMode",
        "dailyStudyHours",
        "takesPracticeTestsRegularly",
        "completedMockTests",
        "Credits",
        "subjectNeedsMostAttention",
        "chapterWiseTests",
        "topicWiseTests",
        "weakAreas",
        "profileImage",
        "createdAt",
        "updatedAt",
        "addedbyAdminId",
        "batchId",
      ],
    });

    // If student not found
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Return student data
    return res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// testing
export {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  savePersonalData,
  getPersonalData,
  newSavePersonalData,
};
