// student.controller.js


import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "config";
import Student from "../models/student.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { sendWhatsAppMessage } from "../utils/sendWhatsapp.js";

let otpStore = {};


import { OAuth2Client } from "google-auth-library";




const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential)
      return res.status(400).json({ message: "Missing Google token" });

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    // Check if student exists
    let student = await Student.findOne({
      where: { emailAddress: email },
    });

    // If user doesn't exist → create one
    if (!student) {
      student = await Student.create({
        fullName: name,
        emailAddress: email,
        password: await bcrypt.hash("google_oauth_login", 10),
        isVerified: true,
        profileImage: picture,
      });
    }

    // Create token
    // const token = jwt.sign(
    //   {
    //     id: student.id,
    //     email: student.emailAddress,
    //   },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "6h" }
    // );

     const token = jwt.sign(
      { id: student.id, email: student.emailAddress, mobile: student.mobileNumber,adminId: student.addedByAdminId,addedByAdminId: student.addedByAdminId },
     process.env.JWT_SECRET,
      { expiresIn: "6h" }
    );


    return res.json({
      message: "Login successful",
      token,
      user: student,
    });
  } catch (err) {
    console.error("Google Login Error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
};


//register - NOW SENDS OTP VIA WHATSAPP ONLY
const register = async (req, res) => {
  try {
    const { name, emailAddress, password, confirmPassword, mobileNumber } = req.body;
    
    if (!name || !emailAddress || !password || !confirmPassword || !mobileNumber) {
      return res.status(400).json({
        message: "Name, email, password, confirm password, and mobile number are required",
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailAddress)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
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

    // Generate a random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    //console.log("📱 Generated OTP:", otp);

    const expirationTime = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Store OTP in the in-memory store (use database for production)
    otpStore[emailAddress] = { otp, expirationTime, mobileNumber };

    // Create the new student in DB with isVerified=false
    // Create the new student in DB with 2 free uses + trial fields
await Student.create({
  fullName: name,           // match your model field
  emailAddress,
  mobileNumber,
  password: hashedPassword,
  isVerified: false,
  
  // ✅ FREE TRIAL FIELDS (2 free tests)
  freeUsageCount: 2,        // starts with 2 free tests
  paymentVerified: false,   // not paid yet
  subscriptionType: null,   // no subscription
  subscriptionStart: null,
  subscriptionEnd: null,
  addedByAdminId: null,     // public student
});


    // ✅ SEND OTP VIA WHATSAPP ONLY - NO EMAIL
    const whatsappResult = await sendWhatsAppMessage(
      mobileNumber,
      `Your OTP for *ExamPortal Registration* is: *${otp}*

This OTP is valid for 10 minutes only.

Please use this code to complete your registration.

If you did not request this, please contact support immediately.

Thank you for using *ExamPortal*!`
    );

    if (!whatsappResult) {
      return res.status(500).json({ message: "Failed to send OTP via WhatsApp" });
    }

    // //console.log("✅ OTP sent successfully via WhatsApp");

    return res.status(201).json({
      message: "Registration successful. OTP has been sent to your WhatsApp.",
      expiresAt: new Date(expirationTime).toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in registerStudent:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const savePersonalData = async (req, res) => {
  try {
    //console.log("Received body:", req.body);
    //console.log("Received file:", req.file);

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
      fullAddress,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !emailAddress) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const id = req.user.id;
    //console.log(id);
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
        return res
          .status(500)
          .json({ message: "Error uploading profile image" });
      }
    }

    const targetYearValue = targetYear ? parseInt(targetYear) : null;

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
      profileImage: updatedProfileImage,
    };

    //console.log("Updating with:", updateData);

    await student.update(updateData);

    return res.status(200).json({
      message: "Personal data updated successfully",
      student,
    });
  } catch (error) {
    console.error("Error saving personal data:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const newSavePersonalData = async (req, res) => {
  try {
    //console.log("📥 Incoming Request Body:", req.body);

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

    if (!id) {
      //console.log("❌ ID is missing in request body");
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findOne({ where: { id } });
    // //console.log("👀 Found Student:", student ? student.toJSON() : "No record found");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (emailAddress) {
      const findEmail = await Student.findOne({
        where: {
          emailAddress,
          addedByAdminId: student.addedByAdminId,
        },
      });

      // //console.log("📧 findEmail:", findEmail ? findEmail.id : "None");

      if (findEmail && findEmail.id !== student.id) {
        return res.status(409).json({ message: "Email address already exists." });
      }
    }

    if (mobileNumber) {
      const findPhone = await Student.findOne({
        where: {
          mobileNumber,
          addedByAdminId: student.addedByAdminId,
        },
      });

      //console.log("📞 findPhone:", findPhone ? findPhone.id : "None");

      if (findPhone && findPhone.id !== student.id) {
        return res.status(409).json({ message: "Phone number already exists." });
      }
    }

    const updateData = {
      firstName: firstName || student.firstName,
      lastName: lastName || student.lastName,
      examType: examType || student.examType,
      dateOfBirth: dateOfBirth || student.dateOfBirth,
      domicileState: domicileState || student.domicileState,
      targetYear: targetYear || student.targetYear,
      mobileNumber: mobileNumber || student.mobileNumber,
      gender: gender || student.gender,
      emailAddress: emailAddress || student.emailAddress,
      fullAddress: fullAddress || student.fullAddress,
      profileImage: updatedImageUrl || student.profileImage,
    };

    //console.log("🛠️ Update Data:", updateData);

    await student.update(updateData);

    // //console.log("✅ Updated Student Successfully");

    return res.status(200).json({
      message: "Personal Data Updated Successfully",
      updatedData: updateData,
    });

  } catch (error) {
    console.error("🔥 Error saving personal Data:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
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
      { id: student.id, email: student.emailAddress,adminId: student.addedByAdminId },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
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

// Resend OTP Controller - NOW SENDS VIA WHATSAPP ONLY
const resendOtp = async (req, res) => {
  try {
    const { emailAddress } = req.body;

    if (!emailAddress) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const storedOtpEntry = otpStore[emailAddress];
    if (!storedOtpEntry) {
      return res.status(400).json({ message: "No OTP request found for this email" });
    }

    const { mobileNumber } = storedOtpEntry;

    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number not found. Please register again." });
    }

    // Generate new OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000;
    
    otpStore[emailAddress] = { otp, expirationTime, mobileNumber };

    // ✅ SEND OTP VIA WHATSAPP ONLY - NO EMAIL
    const whatsappResult = await sendWhatsAppMessage(
      mobileNumber,
      `Your NEW OTP for *ExamPortal Registration* is: *${otp}*

This OTP is valid for 10 minutes only.

If you did not request this, please contact support.

Thank you for using *ExamPortal*!`
    );

    if (!whatsappResult) {
      return res.status(500).json({ message: "Failed to send OTP via WhatsApp" });
    }

    //console.log("✅ OTP resent successfully via WhatsApp");

    return res.status(200).json({ 
      message: "New OTP sent successfully to your WhatsApp.",
      expiresAt: new Date(expirationTime).toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in resendOtp:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Login Controller
// const login = async (req, res) => {
//   try {
//     const { emailAddress, mobileNumber, password } = req.body;

//     //console.log("=== LOGIN DEBUG ===");
//     //console.log("Login attempt:", { emailAddress, mobileNumber });

//     if ((!emailAddress && !mobileNumber) || !password) {
//       return res.status(400).json({
//         message: "Please provide either Email or Mobile number and password",
//       });
//     }

//     // Find student by email OR mobile number
//     const student = await Student.findOne({
//       where: {
//         ...(emailAddress
//           ? { emailAddress }
//           : { mobileNumber }),
//       },
//     });

//     if (!student) {
//       //console.log("No student found for given credentials");
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     //console.log("Student found:", student.id, student.emailAddress || student.mobileNumber);

//     // Compare password
//     const isPasswordValid = await bcrypt.compare(password, student.password);
//     if (!isPasswordValid) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Check verification
//     if (!student.isVerified) {
//       return res
//         .status(400)
//         .json({ message: "Please verify your account before logging in" });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { id: student.id, email: student.emailAddress, mobile: student.mobileNumber,adminId: student.addedByAdminId,addedByAdminId: student.addedByAdminId
//  },
//      process.env.JWT_SECRET,
//       { expiresIn: "6h" }
//     );

//     //console.log("=== END LOGIN DEBUG ===");

//     return res.json({
//       message: "Login successful",
//       token,
//     });
//   } catch (error) {
//     console.error("Error in login:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };


const login = async (req, res) => {
  try {
    const { emailAddress, mobileNumber, password } = req.body;

    if ((!emailAddress && !mobileNumber) || !password) {
      return res.status(400).json({
        message: "Please provide either Email or Mobile number and password",
      });
    }

    const student = await Student.findOne({
      where: {
        ...(emailAddress ? { emailAddress } : { mobileNumber }),
      },
    });

    if (!student) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!student.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your account before logging in" });
    }

    // ✅ ✅ ✅ IMPORTANT FIX — PRO DATA JWT ME DAALO
    const token = jwt.sign(
      {
        id: student.id,
        email: student.emailAddress,
        mobile: student.mobileNumber,

        adminId: student.addedByAdminId || null,
        addedByAdminId: student.addedByAdminId || null,

        // ✅ ✅ ✅ PRO FLAGS
        paymentVerified: student.paymentVerified,
        subscriptionType: student.subscriptionType,
        subscriptionEnd: student.subscriptionEnd,
      },
      process.env.JWT_SECRET,
      { expiresIn: "6h" }
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


// Forgot Password - ALREADY USES WHATSAPP ONLY ✅
const forgotPassword = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const student = await Student.findOne({ where: { mobileNumber } });

    if (!student) {
      return res.status(400).json({ message: "No user found with this mobile number" });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP with mobile number as key for password reset
    otpStore[mobileNumber] = { otp, expirationTime, emailAddress: student.emailAddress };

    // ✅ SEND OTP VIA WHATSAPP ONLY
    const whatsappResult = await sendWhatsAppMessage(
      mobileNumber,
      `Your OTP for *Neet720 Password Reset* is: *${otp}*

This OTP is valid for 10 minutes only.

If you did not request this password reset, please contact support immediately.

Thank you for using *ExamPortal*!`
    );

    if (!whatsappResult) {
      return res.status(500).json({ message: "Failed to send OTP via WhatsApp" });
    }

    //console.log("✅ Password reset OTP sent via WhatsApp");

    return res.status(200).json({ 
      message: "OTP sent to your WhatsApp for password reset",
      expiresAt: new Date(expirationTime).toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in forgotPassword:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password Controller - UPDATED TO USE MOBILE NUMBER
const resetPassword = async (req, res) => {
  try {
    const { mobileNumber, otp, newPassword } = req.body;

    if (!mobileNumber || !otp || !newPassword) {
      return res
        .status(400)
        .json({ message: "Mobile number, OTP, and new password are required" });
    }

    // Validate mobile number format
    if (!/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: "Please enter a valid 10-digit mobile number" });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Please enter a valid 6-digit OTP" });
    }

    const storedOtpEntry = otpStore[mobileNumber];
    if (!storedOtpEntry) {
      return res
        .status(400)
        .json({ message: "No OTP found for this mobile number. Please request a new OTP." });
    }

    const { otp: storedOtp, expirationTime } = storedOtpEntry;

    // Check if OTP expired
    if (Date.now() > expirationTime) {
      delete otpStore[mobileNumber];
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one." });
    }

    // Verify OTP matches
    if (otp !== storedOtp) {
      return res.status(400).json({ message: "Invalid OTP. Please check and try again." });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Find student by mobile number
    const student = await Student.findOne({ where: { mobileNumber } });
    
    if (!student) {
      return res.status(400).json({ message: "Student not found with this mobile number" });
    }

    // Update password
    student.password = hashedPassword;
    await student.save();

    // Clear OTP from store
    delete otpStore[mobileNumber];

    //console.log("✅ Password reset successfully for mobile:", mobileNumber);

    return res.status(200).json({ 
      message: "Password reset successfully! You can now log in with your new password." 
    });
  } catch (error) {
    console.error("❌ Error in resetPassword:", error);
    return res.status(500).json({ message: "Internal server error. Please try again." });
  }
};

// const getPersonalData = async (req, res) => {
//   try {
//     const studentId = req.user.id;
//     const student = await Student.findOne({ 
//       where: { id: studentId },
//       attributes: [
//         "firstName",
//         "lastName",
//         "emailAddress",
//         "examType",
//         "studentClass",
//         "targetYear",
//         "fullName",
//         "dateOfBirth",
//         "gender",
//         "mobileNumber",
//         "fullAddress",
//         "domicileState",
//         "parentName",
//         "parentContactNumber",
//         "relationToStudent",
//         "tenthBoard",
//         "tenthYearOfPassing",
//         "tenthPercentage",
//         "eleventhYearOfCompletion",
//         "eleventhpercentage",
//         "twelfthBoard",
//         "twelfthYearofPassing",
//         "twelfthPercentage",
//         "hasAppearedForNEET",
//         "neetAttempts",
//         "targetMarks",
//         "hasTargetFlexibility",
//         "deferredColleges",
//         "PreferredCourses",
//         "CoachingInstituteName",
//         "studyMode",
//         "dailyStudyHours",
//         "takesPracticeTestsRegularly",
//         "completedMockTests",
//         "Credits",
//         "subjectNeedsMostAttention",
//         "chapterWiseTests",
//         "topicWiseTests",
//         "weakAreas",
//         "profileImage",
//         "createdAt",
//         "updatedAt",
//         "addedbyAdminId",
//         "batchId",
//       ],
//     });

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     return res.status(200).json(student);
//   } catch (error) {
//     console.error("Error fetching student data:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

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
        "batchId",

        // ✅ ✅ ✅ ✅ ✅ MOST IMPORTANT FIXES
        "freeUsageCount",        // ✅ FREE TEST COUNT
        "paymentVerified",      // ✅ PRO USER CHECK
        "addedByAdminId"        // ✅ ADMIN STUDENT CHECK  ✅ (CASE FIX)
      ],
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteStudentAccount = async (req, res) => {
  try {
    const studentId = req.user.id;
    //console.log(`Attempting to delete student with ID: ${studentId}`);

    if (!studentId) {
      return res.status(400).json({ message: "Student ID missing" });
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    //console.log(`Deleting student: ${student.email} (ID: ${student.id})`);

    await student.destroy(); // ✅ This removes the record safely

    return res.status(200).json({
      message: "Student deleted successfully",
      deletedStudentId: student.id,
    });
  } catch (error) {
    console.error("Error deleting student account:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

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
  deleteStudentAccount,
  googleLogin,
};