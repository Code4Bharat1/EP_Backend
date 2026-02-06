// roleAuth.js - Role-based access control middleware

import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.model.js";

/**
 * Middleware to verify admin role and permissions
 * @param {Array} allowedRoles - Array of roles that can access the route
 */
export const requireRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization token missing or malformed",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch admin details from database to get current role
      const admin = await Admin.findOne({
        where: { id: decoded.id },
        attributes: ["id", "AdminId", "role", "branch", "Email"],
      });

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Check if admin's role is in allowed roles
      if (allowedRoles.length > 0 && !allowedRoles.includes(admin.role)) {
        return res.status(403).json({
          message: "Insufficient permissions to access this resource",
        });
      }

      // Attach admin info to request
      req.user = {
        adminId: admin.id,
        AdminId: admin.AdminId,
        email: admin.Email,
        role: admin.role,
        branch: admin.branch,
      };

      next();
    } catch (err) {
      console.error("Role auth error:", err.message);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

/**
 * Middleware to check if user can manage staff
 * Admin and Sub-Admin can manage staff
 */
export const canManageStaff = requireRole(["admin", "sub-admin"]);

/**
 * Middleware to check if user is admin only
 */
export const adminOnly = requireRole(["admin"]);

/**
 * Middleware to check if user is sub-admin only
 */
export const subAdminOnly = requireRole(["sub-admin"]);
