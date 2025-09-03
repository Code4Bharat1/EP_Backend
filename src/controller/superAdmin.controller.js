import { Admin } from "../models/admin.model.js";
import { Op, where } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

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
      ExpiryDate,
      address,
      HodName,
      logo,
      navbarColor,
      sidebarColor,
      otherColor,
      role, // optional, defaults to "admin" in model
    } = req.body;

    // Who is adding this admin?
    const creatorFromAuth = req.user?.id ?? null; // requires auth middleware to set req.user
    const creatorFromBody =
      req.body.addedByAdminId ??
      req.body.createdByAdminId ??
      req.body.created_by_admin_id ??
      null;
    const createdByAdminId = creatorFromAuth ?? creatorFromBody ?? null;
    const processedWhatsappNumber =
      whatsappNumber && whatsappNumber.trim() !== "" ? whatsappNumber : null;
    // Basic required field validation (removed AdminId since we'll generate it)
    if (!PassKey || !name || !Email || !mobileNumber) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // If a creator was provided, validate they exist and have a valid role
    if (createdByAdminId !== null) {
      const creator = await Admin.findByPk(createdByAdminId, {
        attributes: ["id", "role"],
      });
      if (!creator) {
        return res.status(400).json({ message: "Creator admin not found." });
      }
      if (!["superadmin", "admin"].includes(creator.role)) {
        return res
          .status(403)
          .json({ message: "Only superadmin or admin can add admins." });
      }
    }

    // Generate unique AdminId
    const AdminId = `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Uniqueness check for Email only (AdminId is now generated)
    const existingAdmin = await Admin.findOne({
      where: { Email },
      attributes: ["id"], // avoid selecting all columns
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin with this Email already exists." });
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
      whatsappNumber: processedWhatsappNumber, // Use processed value
      StartDate,
      ExpiryDate,
      address,
      HodName,
      logo,
      navbarColor,
      sidebarColor,
      otherColor,
      role: role || "admin",
      created_by_admin_id: createdByAdminId,
      credentials: "pending",
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        id: newAdmin.id,
        AdminId: newAdmin.AdminId,
        name: newAdmin.name,
        email: newAdmin.Email,
        created_by_admin_id: newAdmin.created_by_admin_id,
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

const getadmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    if (!adminId) {
      return res
        .status(400)
        .json({ message: "required field not found: adminId" });
    }

    // If your PK is not the AdminId string, use findOne with where:{ AdminId: adminId }
    // const admin = await Admin.findOne({ where: { AdminId: adminId } });
    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      return res.status(404).json({ message: "admin not found" });
    }

    return res.status(200).json({ message: "success", data: admin });
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
    // Identify the admin to update: prefer :id param, else body.id, else AdminId
    const { adminId } = req.params;

    console.log(adminId);

    // Load record
    const admin = await Admin.findByPk(adminId);
    console.log(admin);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Destructure possible inputs
    const {
      name,
      Course,
      Email,
      mobileNumber,
      whatsappNumber,
      StartDate,
      ExpiryDate,
      address,
      HodName,
      // role is intentionally ignored; we don't allow updating it here
      role,
    } = req.body || {};

    // // Enforce uniqueness if AdminId or Email are changing
    // if (newAdminId && newAdminId !== admin.AdminId) {
    //   const clash = await Admin.count({
    //     where: { AdminId: newAdminId, id: { [Op.ne]: admin.id } },
    //   });
    //   if (clash) {
    //     return res.status(400).json({ message: "Another admin already uses this AdminId." });
    //   }
    // }

    console.log(Email);
    console.log(admin.Email);

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

    // Build a whitelist payload (role is intentionally excluded)
    const payload = {};

    // // Hash password if provided
    // if (typeof PassKey === "string" && PassKey.trim() !== "") {
    //   payload.PassKey = await bcrypt.hash(PassKey, 10);
    // }

    // Copy allowed fields if they were provided
    const allowed = [
      "AdminId",
      "name",
      "Course",
      "Email",
      "mobileNumber",
      "whatsappNumber",
      "StartDate",
      "ExpiryDate",
      "address",
      "HodName",
      "logo",
      "navbarColor",
      "sidebarColor",
      "otherColor",
      "credentials", // include if you want to allow toggling pending/sent/etc.
    ];

    // Assign values only if explicitly present in the body (including empty string/null if you want to allow clears)
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        payload[key] = req.body[key];
      }
    }

    // Nothing to update?
    if (!Object.keys(payload).length) {
      return res.status(400).json({ message: "No updatable fields provided." });
    }

    // Apply update
    await admin.update(payload);

    return res.status(200).json({
      message: "Admin updated successfully",
      admin: {
        id: admin.id,
        AdminId: admin.AdminId,
        name: admin.name,
        email: admin.Email,
        // role not returned/changed here
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
  username: "rishi",
  passkey:  "rishi",
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
  superAdminLogin , 
  getAdminList,
  deleteAdminById,
  createAdmin,
  getStaffMember,
  getadmin,
  updateAdmin,
};
