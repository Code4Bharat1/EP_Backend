import { Batch } from "../models/admin.model.js";
import { StudentBatch } from "../models/BatchStudent.model.js";
import Admintest from "../models/admintest.model.js";
import Student from "../models/student.model.js";
import BatchAdmintest from "../models/BatchAdmintest.model.js";
import GenerateTestResult from "../models/generateTestresult.model.js";
// get the test info of that batch
const batchesInfo = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    // 1. Fetch batch details
    const batch = await Batch.findOne({
      where: { batchId },
      attributes: ["batchId", "batchName", "no_of_students"],
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // 2. Fetch associated students
    const students = await batch.getStudents({
      attributes: [
        "id",
        "firstName",
        "lastName",
        "emailAddress",
        "mobileNumber",
        "domicileState",
      ],
      joinTableAttributes: [], // hide join table
    });

    // 3. Fetch tests via many-to-many relation
    const tests = await batch.getTests({
      attributes: [
        "id",
        "testname",
        "no_of_questions",
        "exam_start_date",
        "exam_end_date",
        "duration",
        "subject",
      ],
      joinTableAttributes: [], // hide join table
      order: [["exam_start_date", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      batch,
      students,
      tests,
    });
  } catch (error) {
    console.error("Error fetching batch info:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//get the batch info of that test
export const testBatchesInfo = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({ message: "Test ID is required" });
    }

    // console.log("Received testId:", testId);

    // 1. Fetch the test and include associated batches + students
    const test = await Admintest.findOne({
      where: { id: testId },
      attributes: [
        "id",
        "testname",
        "subject",
        "difficulty",
        "marks",
        "duration",
        "exam_start_date",
        "exam_end_date",
      ],
      include: [
        {
          model: Batch,
          as: "batches", // 👈 must match your association alias
          attributes: ["batchId", "batchName", "no_of_students"],
          through: { attributes: [] }, // hide join table
          include: [
            {
              model: Student,
              as: "Students", // 👈 must match your batch-student alias
              attributes: [
                "id",
                "fullName",
                "emailAddress",
                "mobileNumber",
                "domicileState",
              ],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    return res.status(200).json({
      success: true,
      test,
    });
  } catch (error) {
    console.error("Error fetching test batches info:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
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

//assign batch to the test
export const assignBatchesToTest = async (req, res) => {
  try {
    const { batchIds } = req.body; // batchIds = array of batch IDs
    const { testId } = req.params;

    if (!testId || !Array.isArray(batchIds) || batchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "testId and batchIds[] are required",
      });
    }

    // Check if test exists
    const test = await Admintest.findByPk(testId);
    if (!test) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    // Check if all batches exist
    const batches = await Batch.findAll({ where: { batchId: batchIds } });
    if (batches.length !== batchIds.length) {
      return res.status(404).json({
        success: false,
        message: "Some batches not found",
      });
    }

    // Create or skip duplicates (thanks to unique index on batchId + admintestId)
    const assignments = await Promise.all(
      batchIds.map(async (batchId) => {
        return BatchAdmintest.findOrCreate({
          where: { batchId, admintestId: testId },
        });
      })
    );

    return res.status(200).json({
      success: true,
      message: `Assigned ${batchIds.length} batch(es) to test ${testId}`,
      assignments,
    });
  } catch (error) {
    console.error("Error assigning batches:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign batches",
      error: error.message,
    });
  }
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
    // console.log("Response:", response);

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

const getBatchesForAdmin = async (req, res) => {
  try {
    const { adminId } = req.params; // Assuming the adminId is passed as a URL parameter

    if (!adminId) {
      return res.status(400).json({
        message: "Admin ID is required",
      });
    }

    // Fetch batches for the given adminId
    const batches = await Batch.findAll({
      where: { admin_id : adminId }, // Filter by adminId (assuming this field exists in the Batch model)
      attributes: ["batchId", "batchName"],
    });

    if (!batches || batches.length === 0) {
      return res.status(404).json({
        message: "No batches found for this admin",
      });
    }

    return res.status(200).json({
      message: "Batches fetched successfully",
      batches,
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return res.status(500).json({
      message: "Failed to retrieve batches",
      error: error.message,
    });
  }
};

export const removeBatchesFromTest = async (req, res) => {
  try {
    const { batchIds } = req.body; // batchIds = array of batch IDs
    const { testId } = req.params;

    if (!testId || !Array.isArray(batchIds) || batchIds.length === 0) {
      // console.log("Invalid input:", { testId, batchIds });
      return res.status(400).json({
        success: false,
        message: "testId and batchIds[] are required",
      });
    }

    // Check if test exists
    const test = await Admintest.findByPk(testId);
    if (!test) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    // Check if all batches exist
    const batches = await Batch.findAll({ where: { batchId: batchIds } });
    if (batches.length !== batchIds.length) {
      return res.status(404).json({
        success: false,
        message: "Some batches not found",
      });
    }

    // Remove batch associations
    const removedAssignments = await Promise.all(
      batchIds.map(async (batchId) => {
        return BatchAdmintest.destroy({
          where: {
            batchId,
            admintestId: testId,
          },
        });
      })
    );

    // Check if removal was successful
    if (removedAssignments.every((result) => result > 0)) {
      return res.status(200).json({
        success: true,
        message: `Removed ${batchIds.length} batch(es) from test ${testId}`,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Some batches were not assigned to this test",
      });
    }
  } catch (error) {
    console.error("Error removing batches:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove batches",
      error: error.message,
    });
  }
};

export const getBatchesByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ success: false, message: "Student ID is required" });
    }

    // Find student with related batches
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: Batch,
          through: { attributes: [] }, // hide join table columns
          attributes: ["batchId", "batchName", "no_of_students"],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.status(200).json({
      success: true,
      studentId: student.id,
      studentName: student.fullName || `${student.firstName} ${student.lastName}`,
      batches: student.Batches, // populated by association
    });
  } catch (error) {
    console.error("Error fetching student batches:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const checkTestAttempt = async (req, res) => {
  try {
    const { studentId, testid } = req.params;

    const attempt = await GenerateTestResult.findOne({
      where: { studentId, testid },
    });

    if (attempt) {
      return res.status(200).json({
        attempted: true,
        status: attempt.status,   // "Pending", "Completed", etc.
        result: attempt,
      });
    } else {
      return res.status(200).json({
        attempted: false,
        status: "Not Attempted",
      });
    }
  } catch (error) {
    console.error("Error checking attempt:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPendingTests = async (req, res) => {
  try {
    const { studentId } = req.params; // Get studentId from request params

    // Step 1: Find the batch to which the student belongs using the StudentBatch model
    const studentBatch = await StudentBatch.findOne({
      where: { studentId }, // Find the student's batch association
    });

    if (!studentBatch) {
      return res.status(404).json({
        success: false,
        message: "Student batch not found",
      });
    }

    const batchId = studentBatch.batchId; // Get batchId from the student's batch association

    // Step 2: Fetch all tests assigned to this batch
    const tests = await BatchAdmintest.findAll({
      where: { batchId }, // Fetch tests based on batchId
    });

    const pendingTests = [];

    // Step 3: Check for pending status for each test
    for (const test of tests) {
      const attempt = await GenerateTestResult.findOne({
        where: { studentId, testid: test.admintestId },
      });

      if (!attempt || attempt.status === "Pending") {
        // If no attempt or the test status is "Pending", add it to pendingTests
        pendingTests.push({
          testId: test.admintestId,
          testname: test.testname,
          status: attempt ? attempt.status : "Not Attempted", // Show the status if available
        });
      }
    }

    if (pendingTests.length > 0) {
      return res.status(200).json({
        success: true,
        pendingTests,
        count : pendingTests.length
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "No pending tests found.",
      });
    }
  } catch (error) {
    console.error("Error fetching pending tests:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export {
  batchesInfo,
  getBatches,
  batchesAndTestInfo,
  getStudentsByBatchId,
  getTestBasicInfo,
  getBatchesForAdmin,
};
