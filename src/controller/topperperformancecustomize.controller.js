import { Op } from "sequelize";
import MeTest from "../models/saved.js";
import Student from "../models/student.model.js";
// me test reuslts summary for all students - customized
export const getTestSummariesForAllStudents1 = async (req, res) => {
  try {
    const adminId = req.user?.adminId;
    console.log("🔥 Customize Controller: Admin ID =", adminId);

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized - Missing Admin ID" });
    }

    const adminIdStr = String(adminId);

    // ✔ Only fetch students added by this admin
    const students = await Student.findAll({
      where: { addedByAdminId: adminIdStr },
      attributes: ["id", "firstName", "lastName"]
    });

    if (!students.length) {
      return res.status(200).json({ message: "No students for this admin", results: [] });
    }

    const studentIds = students.map((s) => s.id);

    // ✔ Fetch only their MeTests
    const tests = await MeTest.findAll({
      where: { studentId: { [Op.in]: studentIds } }
    });

    const results = [];

    for (const student of students) {
      const studentTests = tests.filter((t) => t.studentId === student.id);
      if (!studentTests.length) continue;

      const totalMarks = studentTests.reduce((a, t) => a + t.score, 0);
      const totalPossible = studentTests.reduce(
        (a, t) => a + t.totalQuestions * t.overAllMarks,
        0
      );

      const accuracy = totalPossible
        ? ((totalMarks / totalPossible) * 100).toFixed(2)
        : "0.00";

      const avgMarks =
        studentTests.length > 0 ? (totalMarks / studentTests.length).toFixed(2) : "0.00";

      const subjects = [
        ...new Set(
          studentTests.flatMap((t) =>
            Object.keys(t.subjectWiseMarks ? JSON.parse(t.subjectWiseMarks) : {})
          )
        )
      ];

      results.push({
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        testsTaken: studentTests.length,
        accuracy,
        averageMarks: avgMarks,
        totalMarksForStudent: totalMarks,
        subjectWisePerformance: subjects,
        testNames: studentTests.map((t) => t.testName)
      });
    }

    // Ranking
    results.sort((a, b) => b.averageMarks - a.averageMarks);
    results.forEach((r, idx) => (r.rank = idx + 1));

    return res.status(200).json({
      message: "Customized test summaries fetched successfully",
      results
    });
  } catch (err) {
    console.error("Customize Error:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
