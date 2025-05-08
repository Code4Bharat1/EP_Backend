import { Batch } from "../models/admin.model.js";
import Admintest from "../models/admintest.model.js";
import Student from "../models/student.model.js";

const batchesInfo = async (
  req,
  res
) => {
  try {
    const batchId =
      req.query.batchId || 101;

    if (!batchId) {
      return res.status(400).json({
        message: "Batch Id is required",
      });
    }

    // Fetch batch data to get batchName
    const batchData =
      await Batch.findOne({
        attributes: [
          "batchName",
          "no_of_students",
        ],
        where: { batchId: batchId },
      });

    if (!batchData) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    const batchName =
      batchData.batchName;

    // Fetch students in this batch
    const students =
      await Student.findAll({
        attributes: [
          "id",
          "emailAddress",
          "fullName",
          "mobileNumber",
          "domicileState",
          "batchId",
        ],
        where: { batchId: batchId },
      });

    // Fetch tests where batchName matches
    const adminTests =
      await Admintest.findAll({
        attributes: [
          "testname",
          "no_of_questions",
          "exam_start_date",
          "duration",
          "exam_end_date",
          "subject",
        ],
        where: { batch_name: batchName }, // assuming admintest has batchName column
      });

    return res.status(200).json({
      batchData,
      studentsData: students,
      adminTests,
    });
  } catch (error) {
    console.error(
      "Error fetching batch and student info:",
      error
    );
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export { batchesInfo };
