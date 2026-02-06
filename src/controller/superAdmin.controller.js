// superAdmin.controller.js

import { Admin } from "../models/admin.model.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// const createAdmin = async (req, res) => {
//   try {
//     const {
//       PassKey,
//       name,
//       Course,
//       Email,
//       mobileNumber,
//       whatsappNumber,
//       StartDate,
//       ExpiryDate,
//       address,
//       HodName,
//       logo,
//       navbarColor,
//       sidebarColor,
//       otherColor,
//       role,
//     } = req.body;

//     // Get creator's AdminId (unique string)
//     let creatorAdminId = null;
//     const MAX_SUB_ADMINS = 4;
//     // First try to get from authenticated user
//     if (req.user?.AdminId) {
//       creatorAdminId = req.user.AdminId;
//     }
//     // If not available, get from request body
//     else if (req.body.addedByAdminId) {
//       creatorAdminId = req.body.addedByAdminId;
//     }

//     const processedWhatsappNumber =
//       whatsappNumber && whatsappNumber.trim() !== "" ? whatsappNumber : null;

//     // Basic required field validation
//     if (!PassKey || !name || !Email || !mobileNumber) {
//       return res.status(400).json({ message: "Missing required fields." });
//     }

//     // If a creator was provided, validate they exist and have a valid role
//     if (creatorAdminId !== null) {
//       // Find creator by AdminId
//       const creator = await Admin.findOne({
//         where: { AdminId: creatorAdminId },
//         attributes: ["AdminId", "role"],
//       });

//       if (!creator) {
//         return res.status(400).json({ message: "Creator admin not found." });
//       }

//       if (!["superadmin", "admin"].includes(creator.role)) {
//         return res
//           .status(403)
//           .json({ message: "Only superadmin or admin can add admins." });
//       }

//       // Check if creator has reached the limit of sub-admins (4)
//       const subAdminCount = await Admin.count({
//         where: { created_by_admin_id: creatorAdminId },
//       });

//       // Set the maximum number of sub-admins allowed

//       if (subAdminCount >= MAX_SUB_ADMINS) {
//         return res.status(403).json({
//           message: `You have reached the maximum limit of ${MAX_SUB_ADMINS} sub-admins.`,
//         });
//       }
//     }

//     // Generate unique AdminId for the new admin
//     const newAdminId = `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
//     let emailExists = false;

//     if (creatorAdminId) {
//       emailExists = await Admin.findOne({
//         where: {
//           Email,
//           created_by_admin_id: creatorAdminId, // only check under this creator
//         },
//         attributes: ["id"],
//       });
//     }

//     if (emailExists) {
//       return res.status(400).json({
//         message: "Admin with this Email already exists under your account.",
//       });
//     }

//     // Hash the password
//     const hashedPassKey = await bcrypt.hash(PassKey, 10);

//     // Create new admin
//     const newAdmin = await Admin.create({
//       AdminId: newAdminId,
//       PassKey: hashedPassKey,
//       name,
//       Course,
//       Email,
//       mobileNumber,
//       whatsappNumber: processedWhatsappNumber,
//       StartDate,
//       ExpiryDate,
//       address,
//       HodName,
//       logo,
//       navbarColor,
//       sidebarColor,
//       otherColor,
//       role: role || "admin",
//       created_by_admin_id: creatorAdminId,
//       credentials: "pending",
//     });

//     return res.status(201).json({
//       message: "Admin registered successfully",
//       admin: {
//         id: newAdmin.id,
//         AdminId: newAdmin.AdminId,
//         name: newAdmin.name,
//         email: newAdmin.Email,
//         created_by_admin_id: newAdmin.created_by_admin_id,
//         remainingSubAdminSlots:
//           MAX_SUB_ADMINS -
//           (await Admin.count({
//             where: { created_by_admin_id: creatorAdminId },
//           })),
//       },
//     });
//   } catch (error) {
//     console.error("Error creating admin:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// const createAdmin = async (req, res) => {
//   try {
//     const {
//       PassKey,
//       name,
//       Course,
//       Email,
//       mobileNumber,
//       whatsappNumber,
//       StartDate,
//       ExpiryDate,
//       address,
//       HodName,
//       navbarColor,
//       sidebarColor,
//       otherColor,
//       role,
//     } = req.body;

//     // file from multer
//     const uploadedLogo = req.file
//       ? `/adminLogos/${req.file.filename}`
//       : null;

//     let creatorAdminId = null;
//     const MAX_SUB_ADMINS = 4;

//     if (req.user?.AdminId) {
//       creatorAdminId = req.user.AdminId;
//     } else if (req.body.addedByAdminId) {
//       creatorAdminId = req.body.addedByAdminId;
//     }

//     const processedWhatsappNumber =
//       whatsappNumber && whatsappNumber.trim() !== ""
//         ? whatsappNumber
//         : null;

//     if (!PassKey || !name || !Email || !mobileNumber) {
//       return res.status(400).json({ message: "Missing required fields." });
//     }

//     // Validate creator
//     if (creatorAdminId !== null) {
//       const creator = await Admin.findOne({
//         where: { AdminId: creatorAdminId },
//         attributes: ["AdminId", "role"],
//       });

//       if (!creator) {
//         return res.status(400).json({ message: "Creator admin not found." });
//       }

//       if (!["superadmin", "admin"].includes(creator.role)) {
//         return res
//           .status(403)
//           .json({ message: "Only superadmin or admin can add admins." });
//       }

//       const subAdminCount = await Admin.count({
//         where: { created_by_admin_id: creatorAdminId },
//       });

//       if (subAdminCount >= MAX_SUB_ADMINS) {
//         return res.status(403).json({
//           message: `You have reached the maximum limit of ${MAX_SUB_ADMINS} sub-admins.`,
//         });
//       }
//     }

//     const newAdminId = `ADM-${Date.now()}-${Math.floor(
//       Math.random() * 1000
//     )}`;

//     let emailExists = false;

//     if (creatorAdminId) {
//       emailExists = await Admin.findOne({
//         where: {
//           Email,
//           created_by_admin_id: creatorAdminId,
//         },
//         attributes: ["id"],
//       });
//     }

//     if (emailExists) {
//       return res.status(400).json({
//         message: "Admin with this Email already exists under your account.",
//       });
//     }

//     const hashedPassKey = await bcrypt.hash(PassKey, 10);

//     const newAdmin = await Admin.create({
//       AdminId: newAdminId,
//       PassKey: hashedPassKey,
//       name,
//       Course,
//       Email,
//       mobileNumber,
//       whatsappNumber: processedWhatsappNumber,
//       StartDate,
//       ExpiryDate,
//       address,
//       HodName,
//       logo: uploadedLogo, // ✔ STORE LOGO
//       navbarColor,
//       sidebarColor,
//       otherColor,
//       role: role || "admin",
//       created_by_admin_id: creatorAdminId,
//       credentials: "pending",
//     });

//     return res.status(201).json({
//       message: "Admin registered successfully",
//       admin: {
//         id: newAdmin.id,
//         AdminId: newAdmin.AdminId,
//         name: newAdmin.name,
//         email: newAdmin.Email,
//         logo: newAdmin.logo,
//       },
//     });
//   } catch (error) {
//     console.error("Error creating admin:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };



const createAdmin = async (req, res) => {
  try {
    const {
      PassKey,
      name,
      Course,
      Email,
      mobileNumber,
      whatsappNumber,
      StartDate,
      address,
      HodName,
      navbarColor,
      sidebarColor,
      otherColor,
      role,
      instituteName,
      branch,
    } = req.body;

    const uploadedLogo = req.file
      ? `/adminLogos/${req.file.filename}`
      : null;

    let creatorAdminId = null;  // This will be the numeric ID
    let creatorAdminIdString = null;  // This will be the string AdminId (ADM-xxx)
    let creatorRole = null;
    let creatorBranch = null;

    // Get creator information from middleware (roleAuth sets this)
    if (req.user?.adminId) {
      creatorAdminId = req.user.adminId; // Numeric ID
      creatorAdminIdString = req.user.AdminId; // String AdminId (ADM-xxx)
      creatorRole = req.user.role;
      creatorBranch = req.user.branch;
    } else if (req.body.addedByAdminId) {
      // Fallback for backward compatibility
      creatorAdminIdString = req.body.addedByAdminId;
      
      // Need to fetch creator details
      const creator = await Admin.findOne({
        where: { AdminId: creatorAdminIdString },
        attributes: ["id", "AdminId", "role", "branch"],
      });
      
      if (creator) {
        creatorAdminId = creator.id;
        creatorRole = creator.role;
        creatorBranch = creator.branch;
      }
    }

    const processedWhatsappNumber =
      whatsappNumber && whatsappNumber.trim() !== ""
        ? whatsappNumber
        : null;

    // Validate required fields
    if (!PassKey || !name || !Email || !mobileNumber || !role || !branch) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Validate creator and get their role (if not already set from req.user)
    if (creatorAdminIdString && !creatorRole) {
      const creator = await Admin.findOne({
        where: { AdminId: creatorAdminIdString },
        attributes: ["id", "AdminId", "role", "branch"],
      });

      if (!creator) {
        return res.status(400).json({ message: "Creator admin not found." });
      }

      creatorAdminId = creator.id;
      creatorRole = creator.role;
      creatorBranch = creator.branch;
    }

    // Role-based permissions
    if (creatorRole) {
      if (creatorRole === "admin") {
        // Admin can create sub-admins and branch staff
        if (!["sub-admin", "batchmanager", "teacher", "supporter", "content_manager"].includes(role)) {
          return res.status(403).json({
            message: "Admin can only create sub-admin or branch-specific roles.",
          });
        }

        // Check sub-admin limit (only 1 admin per institute)
        if (role === "admin") {
          return res.status(403).json({
            message: "There can only be one Admin per institute.",
          });
        }
      } else if (creatorRole === "sub-admin") {
        // Sub-admin cannot create admin or sub-admin
        if (["admin", "sub-admin"].includes(role)) {
          return res.status(403).json({
            message: "Sub-admin cannot create Admin or Sub-Admin roles.",
          });
        }

        // Sub-admin can only create staff for their own branch
        if (!["batchmanager", "teacher", "supporter", "content_manager"].includes(role)) {
          return res.status(403).json({
            message: "Sub-admin can only create branch-specific roles.",
          });
        }

        // Force branch to be the same as creator's branch
        if (branch !== creatorBranch) {
          return res.status(403).json({
            message: "Sub-admin can only create staff for their own branch.",
          });
        }
      } else if (!["superadmin", "admin"].includes(creatorRole)) {
        return res.status(403).json({
          message: "Insufficient permissions to add staff.",
        });
      }
    }

    const newAdminId = `ADM-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;

    // Check email uniqueness
    const emailExists = await Admin.findOne({
      where: { Email },
      attributes: ["id"],
    });

    if (emailExists) {
      return res.status(400).json({
        message: "Admin with this Email already exists.",
      });
    }

    // Fetch creator's logo and instituteName to inherit
    let creatorLogo = null;
    let creatorInstituteName = instituteName;
    
    if (creatorAdminId) {
      const creator = await Admin.findByPk(creatorAdminId, {
        attributes: ["logo", "instituteName"],
      });
      
      if (creator) {
        creatorLogo = creator.logo;
        creatorInstituteName = creator.instituteName || instituteName;
      }
    }

    const hashedPassKey = await bcrypt.hash(PassKey, 10);

    const newAdmin = await Admin.create({
      AdminId: newAdminId,
      PassKey: hashedPassKey,
      name,
      Course,
      Email,
      mobileNumber,
      whatsappNumber: processedWhatsappNumber,
      StartDate,
      address,
      HodName,
      navbarColor,
      sidebarColor,
      otherColor,
      logo: uploadedLogo || creatorLogo,  // Use uploaded logo or inherit from creator
      role,
      instituteName: creatorInstituteName,  // Inherit from creator
      branch,
      created_by_admin_id: creatorAdminId,
      credentials: "pending",
    });

    return res.status(201).json({
      message: "Staff member registered successfully",
      admin: {
        id: newAdmin.id,
        AdminId: newAdmin.AdminId,
        name: newAdmin.name,
        email: newAdmin.Email,
        role: newAdmin.role,
        logo: newAdmin.logo,
        instituteName: newAdmin.instituteName,
        branch: newAdmin.branch,
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


const getAdminList = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: [
        "name",
        "AdminId",
        "id",
        "role",
        "created_by_admin_id",
        "Email",
        "ExpiryDate",
      ], // only these fields
      order: [["ExpiryDate", "ASC"]], // optional: sorts by expiry date
    });

    return res.status(200).json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteAdminById = async (req, res) => {
  const { AdminId } = req.body;

  if (!AdminId) {
    return res.status(400).json({ message: "AdminId is required." });
  }

  try {
    const deleted = await Admin.destroy({
      where: { AdminId },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: "Admin not found." });
    }

    return res
      .status(200)
      .json({ message: `Admin with ID ${AdminId} has been deleted.` });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getStaffMember = async (req, res) => {
  try {
    const { adminId } = req.query;

    if (!adminId) {
      res.status(400).json({ message: "required field not found" });
    }

    const members = await Admin.findAll({
      where: { created_by_admin_id: adminId }, // <-- correct field
      attributes: [
        "id",
        "AdminId",
        "name",
        "Email",
        "role",
        "StartDate",
        "ExpiryDate",
        "mobileNumber",
        "whatsappNumber",
        "address",
        "HodName",
        "branch",
      ],
      order: [["created_at", "DESC"]], // underscored: true => created_at
    });
    // 200 with empty list is standard
    return res.status(200).json({
      message: "success",
      count: members.length,
      data: members,
    });
  } catch (error) {
    console.error("Error fetching sub-admins:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// const getadmin = async (req, res) => {
//   try {
//     const { adminId } = req.params;
//     if (!adminId) {
//       return res
//         .status(400)
//         .json({ message: "required field not found: adminId" });
//     }

//     // If your PK is not the AdminId string, use findOne with where:{ AdminId: adminId }
//     // const admin = await Admin.findOne({ where: { AdminId: adminId } });
//     const admin = await Admin.findByPk(adminId);

//     if (!admin) {
//       return res.status(404).json({ message: "admin not found" });
//     }

//     return res.status(200).json({ message: "success", data: admin });
//   } catch (error) {
//     console.error("error in getadmin:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// const getadmin = async (req, res) => {
//   try {
//     const { adminId } = req.params;

//     if (!adminId) {
//       return res.status(400).json({ message: "required field not found: adminId" });
//     }

//     // 🟢 FIX: AdminId is NOT primary key — find using where
//     const admin = await Admin.findOne({
//       where: { AdminId: adminId },
//     });

//     if (!admin) {
//       return res.status(404).json({ message: "admin not found" });
//     }

//     return res.status(200).json({
//       message: "success",
//       data: admin,
//     });
    
//   } catch (error) {
//     console.error("error in getadmin:", error);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

const getadmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: "required field not found: adminId" });
    }

    // Try to find by primary key (numeric id) first
    let admin = await Admin.findByPk(adminId);

    // If not found and adminId looks like a string (ADM-xxx), try finding by AdminId field
    if (!admin && isNaN(adminId)) {
      admin = await Admin.findOne({
        where: { AdminId: adminId },
      });
    }

    if (!admin) {
      return res.status(404).json({ message: "admin not found" });
    }

    return res.status(200).json({
      message: "success",
      data: admin,
    });

  } catch (error) {
    console.error("error in getadmin:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};


const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const { Email } = req.body || {};

    if (Email && Email !== admin.Email) {
      const clash = await Admin.count({
        where: { Email, id: { [Op.ne]: admin.id } },
      });
      if (clash) {
        return res
          .status(400)
          .json({ message: "Another admin already uses this Email." });
      }
    }

    const payload = {};

    const allowed = [
      "AdminId",
      "name",
      "Course",
      "Email",
      "mobileNumber",
      "whatsappNumber",
      "StartDate",
      "address",
      "HodName",
      "logo",
      "navbarColor",
      "sidebarColor",
      "otherColor",
      "credentials",
      "branch",
    ];

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        payload[key] = req.body[key];
      }
    }

    if (!Object.keys(payload).length) {
      return res.status(400).json({ message: "No updatable fields provided." });
    }

    await admin.update(payload);

    return res.status(200).json({
      message: "Admin updated successfully",
      admin: {
        id: admin.id,
        AdminId: admin.AdminId,
        name: admin.name,
        email: admin.Email,
      },
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Fixed super admin credentials (in production, use environment variables)
const FIXED_SUPER_ADMIN = {
  username: "yogu",
  passkey: "yogu",
};

const superAdminLogin = async (req, res) => {
  try {
    const { username, passkey } = req.body;

    // Basic validation
    if (!username || !passkey) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Check against fixed credentials
    if (
      username !== FIXED_SUPER_ADMIN.username ||
      passkey !== FIXED_SUPER_ADMIN.passkey
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        username: FIXED_SUPER_ADMIN.username,
        role: "superadmin",
        type: "fixed", // Indicate this is a fixed superadmin
      },
      process.env.JWT_SECRET, // Store this in your .env file
      { expiresIn: "24h" } // Token expiration time
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Super admin login successful",
      token,
      admin: {
        username: FIXED_SUPER_ADMIN.username,
        role: "superadmin",
      },
    });
  } catch (error) {
    console.error("Super admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  superAdminLogin,
  getAdminList,
  deleteAdminById,
  createAdmin,
  getStaffMember,
  getadmin,
  updateAdmin,
};
