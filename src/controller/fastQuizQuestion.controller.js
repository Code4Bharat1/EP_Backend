// import { Op } from "sequelize";
// import { Question } from "../models/everytestmode.refrence.js";
// import { Option } from "../models/everytestmode.refrence.js";
// import { sequelizeCon } from "../init/dbConnection.js";

// const getRandomQuestions = async (req, res) => {
//   try {
//     let { numberOfQuestions, excludeIds } = req.body;
//     numberOfQuestions = parseInt(numberOfQuestions, 10);
//     if (!Array.isArray(excludeIds)) excludeIds = [];

//     const baseFilter = {};
//     if (excludeIds.length) baseFilter.id = { [Op.notIn]: excludeIds };

//     const filtered = await Question.findAll({
//       where: baseFilter,
//       order: sequelizeCon.random(),
//       limit: numberOfQuestions,
//       include: [{
//         model: Option,
//         as: 'options',
//         attributes: ['id', 'question_id', 'option_text', 'is_correct']
//       }]
//     });

//     const remaining = numberOfQuestions - filtered.length;
//     let filler = [];
//     if (remaining > 0) {
//       const allExcluded = [...excludeIds, ...filtered.map((q) => q.id)];
//       filler = await Question.findAll({
//         where: {
//           id: { [Op.notIn]: allExcluded },
//         },
//         order: sequelizeCon.random(),
//         limit: remaining,
//         include: [{
//           model: Option,
//           as: 'options',
//           attributes: ['id', 'question_id', 'option_text', 'is_correct']
//         }]
//       });
//     }

//     const finalSet = [...filtered, ...filler];
//     return res.status(200).json({
//       totalRequested: numberOfQuestions,
//       returned: finalSet.length,
//       filteredMatch: filtered.length,
//       questions: finalSet,
//     });
//   } catch (error) {
//     console.error("Error fetching questions:", error);
//     return res.status(500).json({ message: "Server Error" });
//   }
// };

// export default getRandomQuestions;


import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { Question, Option } from "../models/everytestmode.refrence.js";
import Student from "../models/student.model.js";
import { sequelizeCon } from "../init/dbConnection.js";

const getRandomQuestions = async (req, res) => {
  try {
    // ✅ ✅ ✅ TOKEN DIRECT CONTROLLER ME VERIFY
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const studentId = decoded.id;
    const adminId = decoded.adminId || null;

    // ✅ ✅ ✅ ADMIN / ADMIN-STUDENT = UNLIMITED (NO FREE LOGIC)
    if (!adminId && decoded.role !== "admin") {
      const student = await Student.findByPk(studentId);

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // ✅ ✅ ✅ PAID STUDENT = UNLIMITED
      if (!student.paymentVerified) {
        // ✅ ✅ ✅ FREE LIMIT OVER
        if (student.freeUsageCount <= 0) {
          return res.status(403).json({
            message: "Free test limit over. Please upgrade.",
            remainingFreeUses: 0
          });
        }

        // ✅ ✅ ✅ DECREASE FREE USAGE HERE
        student.freeUsageCount -= 1;
        await student.save();
      }
    }

    // ✅ ✅ ✅ QUESTIONS FETCH LOGIC START
    let { numberOfQuestions, excludeIds } = req.body;

    numberOfQuestions = parseInt(numberOfQuestions, 10);
    if (!Array.isArray(excludeIds)) excludeIds = [];

    const baseFilter = {};
    if (excludeIds.length) baseFilter.id = { [Op.notIn]: excludeIds };

    const filtered = await Question.findAll({
      where: baseFilter,
      order: sequelizeCon.random(),
      limit: numberOfQuestions,
      include: [
        {
          model: Option,
          as: "options",
          attributes: ["id", "question_id", "option_text", "is_correct"],
        },
      ],
    });

    const remaining = numberOfQuestions - filtered.length;
    let filler = [];

    if (remaining > 0) {
      const allExcluded = [...excludeIds, ...filtered.map((q) => q.id)];
      filler = await Question.findAll({
        where: {
          id: { [Op.notIn]: allExcluded },
        },
        order: sequelizeCon.random(),
        limit: remaining,
        include: [
          {
            model: Option,
            as: "options",
            attributes: ["id", "question_id", "option_text", "is_correct"],
          },
        ],
      });
    }

    const finalSet = [...filtered, ...filler];

    return res.status(200).json({
      success: true,
      totalRequested: numberOfQuestions,
      returned: finalSet.length,
      questions: finalSet,
    });

  } catch (error) {
    console.error("❌ Error fetching questions:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export default getRandomQuestions;
