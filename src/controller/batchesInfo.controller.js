import { Batch } from "../models/admin.model.js";
import Admintest from "../models/admintest.model.js";
import Student from "../models/student.model.js";

const batchesInfo = async (req, res) => {
  try {
    const batchId = req.query.batchId;

    if (!batchId) {
      return res.status(400).json({
        message: "Batch Id is required",
      });
    }

    // Fetch batch data to get batchName
    const batchData = await Batch.findOne({
      attributes: ["batchName", "no_of_students"],
      where: { batchId: batchId },
    });

    if (!batchData) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    const batchName = batchData.batchName;

    // Fetch students in this batch
    const students = await Student.findAll({
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
    const adminTests = await Admintest.findAll({
      attributes: [
        "testname",
        "no_of_questions",
        "exam_start_date",
        "duration",
        "exam_end_date",
        "subject",
      ],
      where: {
        batch_name: batchName,
      }, // assuming admintest has batchName column
    });

    return res.status(200).json({
      batchData,
      studentsData: students,
      adminTests,
    });
  } catch (error) {
    console.error("Error fetching batch and student info:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Export the controller function
const getBatches = async (req, res) => {
  const batches = await Batch.findAll({
    attributes: ["batchId", "batchName"],
  });
  res.json(batches);
};

const batchesAndTestInfo = async (req, res) => {
  try {
    const { batchId, testId } = req.body;

    // Validate input
    if (!batchId || !testId) {
      return res.status(400).json({
        message: "Both Batch ID and Test ID are required",
      });
    }

    // Fetch batch data
    const batchData = await Batch.findOne({
      attributes: ["batchId"],
      where: { batch_id: batchId },
    });

    if (!batchData) {
      return res.status(404).json({
        message: "Batch not found",
      });
    }

    // Fetch specific test data
    const testData = await Admintest.findOne({
      attributes: [
        "id", // Include original id field
        ["id", "testId"], // Also map id to testId
        "testname",
        "topic_name",
        "subject",
      ],
      where: {
        id: testId,
        batchId: batchId,
      },
    });

    if (!testData) {
      return res.status(404).json({
        message: "Test not found for this batch",
      });
    }
    // console.log("Batch Data:", batchData);
    // const allTopics = [];
    // testData.topic_name.forEach((item) => {
    //     allTopics.push(item);
    // });
    // console.log("All Topics:", allTopics);

    // Format the response
    const response = {
      batchId: batchData.batchId,
      testId: testData.testId,
      testName: testData.testname,
      chapters: Array.isArray(testData.topic_name)
        ? testData.topic_name.join(", ")
        : testData.topic_name || "", // Convert JSON array to comma-separated string
      subject: testData.subject,
    };
    console.log("Response:", response);

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching batch and test info:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
export { batchesInfo, getBatches, batchesAndTestInfo };
