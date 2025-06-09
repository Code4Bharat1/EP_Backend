import { Batch } from "../models/admin.model.js";
import Student from "../models/student.model.js";
import Admintest from "../models/admintest.model.js";

export const getStudentsByBatchName = async (req, res) => {
  try {
    const { batchName, admin_id } = req.body;

    if (!batchName || !admin_id) {
      return res.status(400).json({ error: "Batch name and admin ID are required" });
    }

    const batch = await Batch.findOne({
      where: {
        batchName,
        admin_id,
      },
    });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found for this admin" });
    }

    const students = await Student.findAll({
      where: { batchId: batch.batchId },
      attributes: ["id", "fullName"],
    });

    // Return both IDs and names
    const studentList = students.map((s) => ({
      id: String(s.id),
      fullName: s.fullName,
    }));

    return res.status(200).json({
      batchId: String(batch.batchId),
      students: studentList,         // array of { id, fullName }
      studentIds: studentList.map(s => s.id),  // keep for backward compatibility if needed
    });
  } catch (err) {
    console.error("Error in getStudentsByBatchName:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const verifyStudentIdsForAdmin = async (req, res) => {
  try {
    const { admin_id, student_ids } = req.body;

    if (!admin_id || !Array.isArray(student_ids)) {
      return res.status(400).json({ error: "admin_id and student_ids are required" });
    }

    // Always use strings for comparison
    const inputIds = student_ids.map(id => String(id));

    // Fetch students that match both student_ids and admin_id
    const students = await Student.findAll({
      where: {
        id: inputIds,
        addedByAdminId: admin_id,
      },
      attributes: ["id", "fullName"],
    });

    const validIds = students.map((s) => String(s.id));
    const invalidIds = inputIds.filter((id) => !validIds.includes(id));
    const validStudents = students.map((s) => ({
      id: String(s.id),
      fullName: s.fullName,
    }));

    return res.status(200).json({
      validStudentIds: validStudents,
      invalidStudentIds: invalidIds,
    });
  } catch (error) {
    console.error("Error verifying student IDs:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



export const getQuestionCountByTestId = async (req, res) => {
  try {
    const { testid } = req.body;

    if (!testid) {
      return res.status(400).json({ message: "testid is required" });
    }

    // 1. Get the test and question_ids field
    const test = await Admintest.findOne({
      where: { id: testid },
      attributes: ["question_ids"],
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    let questionMapping = test.question_ids;

    // 2. Parse if it's a JSON string
    if (typeof questionMapping === "string") {
      try {
        questionMapping = JSON.parse(questionMapping);
      } catch (err) {
        return res.status(500).json({
          message: "Failed to parse question_ids JSON",
          error: err.message,
        });
      }
    }

    // 3. Validate format
    if (!Array.isArray(questionMapping)) {
      return res.status(500).json({ message: "Invalid question_ids format" });
    }

    // 4. Count total questions
    let totalQuestions = 0;
    for (const { ids } of questionMapping) {
      if (Array.isArray(ids)) {
        totalQuestions += ids.length;
      }
    }

    return res.status(200).json({
      message: "Question count fetched successfully",
      count: totalQuestions,
    });

  } catch (error) {
    console.error("Error in getQuestionCountByTestId:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
