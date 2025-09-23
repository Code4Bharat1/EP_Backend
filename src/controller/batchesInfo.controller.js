import { Batch } from "../models/admin.model.js";
import { StudentBatch } from "../models/BatchStudent.model.js";
import Admintest from "../models/admintest.model.js";
import Student from "../models/student.model.js";

const batchesInfo = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    console.log("Received batchId:", batchId);

    // 1. Fetch batch details
    const batch = await Batch.findOne({
      where: { batchId },
      attributes: ["batchId", "batchName", "no_of_students"],
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // 2. Fetch associated students using many-to-many relation
    const students = await batch.getStudents({
      attributes: [
        "id",
        "fullName",
        "emailAddress",
        "mobileNumber",
        "domicileState",
      ],
      joinTableAttributes: [], // hide join table info
    });

    // 3. Fetch all tests where batchName matches
    const adminTests = await Admintest.findAll({
      where: { batch_name: batch.batchName },
      attributes: [
        "id",
        "testname",
        "no_of_questions",
        "exam_start_date",
        "exam_end_date",
        "duration",
        "subject",
      ],
      order: [["exam_start_date", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      batch,
      students,
      tests: adminTests,
    });
  } catch (error) {
    console.error("Error fetching batch info:", error);
    return res.status(500).json({
      success: false,
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

const getStudentsByBatchId = async (req, res) => {
  try {
    const { batchId } = req.body;

    // Verify the batch exists
    const batch = await Batch.findOne({
      where: { batch_id: batchId }, // Use batchId (primary key) instead of batch_id
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Method 1: Using include with the junction table
    // const students = await Student.findAll({
    //   include: [{
    //     model: StudentBatch,
    //     where: { batch_id: batchId },
    //     attributes: [] // Don't include junction table data in response
    //   }],
    //   attributes: {
    //     exclude: ['password'] // Always exclude password
    //   },
    //   order: [
    //     ['fullName', 'ASC'] // Order by full name
    //   ]
    // });

    // Alternative Method 2: Using raw query approach
    const students = await Student.findAll({
      include: [
        {
          model: Batch,
          where: { batch_id: batchId },
          through: { attributes: [] }, // Exclude junction table attributes
          attributes: [], // Don't include batch data in student response
        },
      ],
      attributes: {
        exclude: ["password"],
      },
      order: [["fullName", "ASC"]],
    });

    // Alternative Method 3: Direct junction table query
    // const studentBatchRecords = await StudentBatch.findAll({
    //   where: { batchId: batchId }
    // });
    //
    // const studentIds = studentBatchRecords.map(record => record.studentId);
    //
    // const students = await Student.findAll({
    //   where: {
    //     id: { [Op.in]: studentIds }
    //   },
    //   attributes: {
    //     exclude: ['password']
    //   },
    //   order: [
    //     ['fullName', 'ASC']
    //   ]
    // });

    if (!students || students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found in this batch",
      });
    }

    res.status(200).json({
      success: true,
      count: students.length,
      batchInfo: {
        batchId: batch.batchId,
        batchName: batch.batchName,
        totalStudents: batch.no_of_students,
      },
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students by batch ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching students",
      error: error.message,
    });
  }
};

const getTestBasicInfo = async (req, res) => {
  try {
    const { testId } = req.body; // or req.query if you prefer

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "Test ID is required",
      });
    }

    // Fetch only the basic test info
    const test = await Admintest.findOne({
      where: { id: testId },
      // attributes: ["id", "testname", "subject"], // Only these fields
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    res.status(200).json({
      success: true,
      testInfo: test,
    });
  } catch (error) {
    console.error("Error fetching test info:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching test info",
      error: error.message,
    });
  }
};

export {
  batchesInfo,
  getBatches,
  batchesAndTestInfo,
  getStudentsByBatchId,
  getTestBasicInfo,
};
