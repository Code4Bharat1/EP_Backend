import Student from "../models/student.model.js";

export const checkFreeUsage = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const student = await Student.findOne({ where: { id: studentId } });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // ADMIN-ADDED STUDENT → UNLIMITED ACCESS
    if (student.addedByAdminId) {
      return next();
    }

    // PUBLIC STUDENT — FREE TEST LIMIT
    if (student.freeUsageCount <= 0) {
      return res.status(403).json({
        message: "Free test attempts over. Please upgrade to PRO to continue.",
        locked: true,
      });
    }

    // FREE usage OK → Allow test
    next();
  } catch (error) {
    console.log("checkFreeUsage Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
