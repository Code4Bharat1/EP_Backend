import jwt from 'jsonwebtoken';
import config from 'config';
import Student from "../models/student.model.js";  // ✅ Add this import

const studentAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("🔑 Token received:", authHeader?.substring(0, 50) + "...");
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const secret = config.get('jwtSecret');
    const decoded = jwt.verify(token, secret);

    // Set basic user info
    req.user = { id: decoded.id };

    // ADMIN CHECK (skip subscription)
    if (decoded.role === 'admin') {
      req.userType = 'admin';
      console.log("✅ Admin access granted");
      return next();
    }

    // ADMIN STUDENT CHECK (skip subscription)
    if (decoded.adminId) {
      req.userType = 'student';
      req.user.studentId = decoded.id;
      req.user.adminId = decoded.adminId;
      console.log("✅ Admin-student access granted");
      return next();
    }

    // ✅ PUBLIC STUDENT - CHECK SUBSCRIPTION/FREE USES
    req.userType = 'public-student';
    req.user.studentId = decoded.id;
    
    console.log("🔍 Checking public-student subscription:", decoded.id);
    
    const student = await Student.findByPk(decoded.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ PAID SUBSCRIPTION
    if (student.paymentVerified) {
      const now = new Date();
      if (!student.subscriptionEnd || student.subscriptionEnd < now) {
        return res.status(403).json({ message: "Subscription expired" });
      }
      console.log("✅ Paid subscription valid");
      return next();
    }

    // ✅ FREE TRIAL CHECK
    if (student.freeUsageCount <= 0 && !student.paymentVerified) {
  req.paywallActive = true;
  req.remainingFreeUses = 0;
  console.log("🛑 PAYWALL: Data visible, actions blocked");
  return next();  // ✅ LET DATA THROUGH
}

    // ✅ Consume 1 free use
    student.freeUsageCount -= 1;
    await student.save();
    console.log(`✅ Free use consumed. ${student.freeUsageCount} remaining`);
    
    return next();

  } catch (err) {
    console.error("❌ Token error:", err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export { studentAuth };
