import { Op } from "sequelize";
import MeTest from "../models/saved.js";  // Import the MeTest model
import Student from "../models/student.model.js";  // Import the Student model

// Controller to get selected fields of MeTest for the last test of all students
export const getLastTestResultsForAllStudents1 = async (req, res) => {
  try {
    const adminId = req.user?.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const students = await Student.findAll({
      where: { addedByAdminId: adminId },
      attributes: ["id", "firstName", "lastName"]
    });

    if (!students.length) return res.status(200).json({ results: [] });

    const ids = students.map(s => s.id);

    const tests = await MeTest.findAll({
      where: { studentId: { [Op.in]: ids } },
      attributes: ["studentId", "totalQuestions", "overAllMarks"],
      order: [["createdAt", "DESC"]]
    });

    const results = students.map(student => {
      const t = tests.find(x => x.studentId === student.id);
      if (!t) return null;

      return {
        studentId: student.id,
        fullName: `${student.firstName} ${student.lastName}`,
        marksObtained: t.overAllMarks,
        totalMarks: t.totalQuestions * 4
      };
    }).filter(Boolean);

    return res.status(200).json({ results });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

