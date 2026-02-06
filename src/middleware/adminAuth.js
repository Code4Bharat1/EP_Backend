import jwt from "jsonwebtoken";

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token missing or malformed"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle different token formats
    // Format 1: { id: X, role: Y, adminId: "ADM-xxx" } from newadmin.controller
    // Format 2: { adminId: X, email: Y } from admin.controller
    const adminId = decoded.adminId || decoded.id;
    
    req.user = {
      adminId: adminId,                    // numeric DB admin.id
      loginId: decoded.AdminId || null,    // ADM-xxxx (if available)
      email: decoded.email || null,
      role: decoded.role || null
    };

    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export { verifyAdmin };
