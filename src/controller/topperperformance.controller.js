import { Op } from "sequelize";
import FullTestResults from "../models/fullTestResults.model.js";
import Student from "../models/student.model.js";

export const getTestSummariesForAllStudents = async (req, res) => {
  try {
    // ✔ GET NUMERIC ADMIN ID
    const adminId = req.user?.adminId;
    console.log("🔥 Controller: Admin ID =", adminId);

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized - Missing Admin ID" });
    }

    const adminIdStr = String(adminId);

    // ✔ Fetch only this admin's students
    const students = await Student.findAll({
      where: { addedByAdminId: adminIdStr },
      attributes: ["id", "firstName", "lastName"]
    });

    if (!students.length) {
      return res.status(200).json({ message: "No students for this admin", results: [] });
    } 

    const studentIds = students.map((s) => s.id);

    // ✔ Fetch test results only for those students
    const tests = await FullTestResults.findAll({
      where: { studentId: { [Op.in]: studentIds } },
      attributes: ["studentId", "testName", "marksObtained", "totalMarks"]
    });

    const results = [];

    for (const student of students) {
      const studentTests = tests.filter((t) => t.studentId === student.id);
      if (!studentTests.length) continue;

      // Calculations
      const totalMarks = studentTests.reduce((a, t) => a + t.marksObtained, 0);
      const totalPossible = studentTests.length * 720;

      const accuracy = totalPossible > 0
        ? ((totalMarks / totalPossible) * 100).toFixed(2)
        : "0.00";

      const avgMarks =
        studentTests.length > 0 ? (totalMarks / studentTests.length).toFixed(2) : "0.00";

      results.push({
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        testsTaken: studentTests.length,
        accuracy,
        averageMarks: avgMarks,
        totalMarksForStudent: totalMarks,
        subjectWisePerformance: ["Physics", "Chemistry", "Biology"],
        testNames: studentTests.map((t) => t.testName)
      });
    }

    // Ranking
    results.sort((a, b) => b.averageMarks - a.averageMarks);
    results.forEach((r, idx) => (r.rank = idx + 1));

    return res.status(200).json({
      message: "Full Test summaries fetched successfully",
      results
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
