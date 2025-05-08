import jwt from 'jsonwebtoken';
import config from 'config';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing or malformed" });
    }
  
    const token = authHeader.split(" ")[1];
  
    try {
      const decoded = jwt.verify(token, config.get("jwtSecret"));
      req.adminId = decoded.id; // Attach adminId to request
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
      console.error("Token verification error:", err);
    }
  };

  export { verifyToken };