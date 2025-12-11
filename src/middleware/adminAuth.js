import jwt from "jsonwebtoken";
import config from "config";

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

    // THE ONLY VALID FORMAT
    req.user = {
      adminId: decoded.id,        // numeric DB admin.id
      loginId: decoded.adminId,   // ADM-xxxx
      email: decoded.email
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export { verifyAdmin };
