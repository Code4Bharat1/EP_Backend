import Student from "../models/student.model.js";
export const checkStudentAccess = async (req, res, next) => {
  try {
    // ✅ Admin: unlimited access (verifyToken already set req.userType)
    if (req.userType === "admin") return next();

    // ✅ Admin-created student: unlimited access
    if (req.userType === "student") return next();

    // ✅ Public student: check free uses OR subscription
    if (req.userType === "public-student") {
      const student = await Student.findByPk(req.user.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // ✅ SUBSCRIBED: check expiry only
      if (student.paymentVerified) {
        const now = new Date();
        if (!student.subscriptionEnd || student.subscriptionEnd < now) {
          return res.status(403).json({ message: "Subscription expired" });
        }
        return next(); // ✅ unlimited access
      }

      // ✅ FREE TRIAL: check remaining uses
      if (student.freeUsageCount <= 0) {
        return res.status(402).json({ 
          message: "Free tests over (2/2 used). Please buy the course to continue.",
          remainingFreeUses: 0
        });
      }

      // ✅ Consume 1 free use
      student.freeUsageCount -= 1;
      await student.save();
      
      console.log(`Free use consumed. ${student.freeUsageCount} remaining for student ${student.id}`);
      return next();
    }

    return res.status(401).json({ message: "Unauthorized" });
  } catch (err) {
    console.error("checkStudentAccess error:", err);
    return res.status(500).json({ message: "Access check failed" });
  }
};
