import { dataofquestions as syllabus } from "../../public/cleaned.js";
import {
  RecommendedTest,
  SubjectUnit,
  AttemptedRecoTest,
} from "../models/recommendedtest.model.js";
import {
  Diagram,
  Option,
  Pdf,
  Question,
} from "../models/everytestmode.refrence.js";

// Controller to get all RecommendedTest records with their associated units
const getAllDataFromSchema = async (req, res) => {
  try {
    // Use Sequelize include option to fetch related SubjectUnit records for every test
    const data = await RecommendedTest.findAll({
      include: [
        {
          model: SubjectUnit,
          as: "units",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
};

// Function to calculate allocated time and questions for each subject and chapter
const generateTestPlan = (targetMarks, weakSubject, strongSubject, availableTime) => {
  const subjects = ["Biology", "Physics", "Chemistry"];

  // ------------------------------
  // 1. Assign multipliers
  // ------------------------------
  const multipliers = {};
  subjects.forEach((sub) => {
    if (sub === strongSubject) multipliers[sub] = 1.4;     // Strongest
    else if (sub === weakSubject) multipliers[sub] = 0.8; // Weakest
    else multipliers[sub] = 1.0;                           // Neutral
  });

  const totalMultiplier = Object.values(multipliers).reduce((a, b) => a + b, 0);

  // ------------------------------
  // 2. Allocate marks fairly
  // ------------------------------
  const allocatedMarks = {};
  subjects.forEach((sub) => {
    allocatedMarks[sub] = Math.max(
      4, // At least 1 question (4 marks)
      Math.floor((targetMarks * multipliers[sub]) / totalMultiplier)
    );
  });

  // ------------------------------
  // 3. Generate subject-wise plan
  // ------------------------------
  const subjectWisePlan = {};
  const chapterWisePlan = [];

  subjects.forEach((subject) => {
    if (!(subject in syllabus)) return;

    const chapters = syllabus[subject];
    const totalWeightage = Object.values(chapters).reduce(
      (sum, chapter) => sum + Number(chapter.weightage),
      0
    );

    const subjectAllocatedMarks = allocatedMarks[subject];
    const subjectAllocatedTime = availableTime * (subjectAllocatedMarks / targetMarks);

    const subjectPlan = [];

    // Loop each chapter
    for (const [chapterName, details] of Object.entries(chapters)) {
      const chapterWeight = Number(details.weightage);

      const chapterMarks = Math.max(
        4,
        Math.floor((chapterWeight / totalWeightage) * subjectAllocatedMarks)
      );

      const chapterQuestions = Math.max(1, Math.floor(chapterMarks / 4));

      const chapterTime = Math.max(
        0.3, // At least 0.3 days
        subjectAllocatedTime * (chapterMarks / subjectAllocatedMarks)
      );

      const chapterPlan = {
        chapter: chapterName,
        allocated_questions: chapterQuestions,
        allocated_time: `${chapterTime.toFixed(2)} days`,
        recommended_tests: Math.max(1, Math.floor(chapterQuestions / 3)),
      };

      subjectPlan.push(chapterPlan);
      chapterWisePlan.push(chapterPlan);
    }

    subjectWisePlan[subject] = { chapters: subjectPlan };
  });

  return { subjectWisePlan, chapterWisePlan };
};

const CreateEntry = async (req, res) => {
  try {
    // ✅ STEP 1: BLOCK IF PAYWALL ACTIVE (cannot START test)
    if (req.paywallActive) {
      console.log("🛑 BLOCKED: Cannot start test - paywall active");
      return res.status(403).json({
        message: "Cannot start test. Free tests used up. Please upgrade to premium.",
        paywallActive: true,
        remainingFreeUses: req.remainingFreeUses || 0,
      });
    }

    const { target_marks, weak_subject, strong_subject, available_time } = req.body;

    if (!target_marks || !weak_subject || !strong_subject || !available_time) {
      return res.status(400).json({
        message: "Validation error: All fields are required",
      });
    }

    // Generate the test plan using the new generateTestPlan function
    const { subjectWisePlan, chapterWisePlan } = generateTestPlan(
      target_marks,
      weak_subject,
      strong_subject,
      available_time
    );

    // Create the main RecommendedTest record
    const newTest = await RecommendedTest.create({
      studentId: req.user.id,
      difficultyLevel: getRandomDifficulty(),
      testName: "System Test",
      status: "pending",
    });

    // ... your existing getRandomDifficulty, processSubjectWisePlan, processChapterWisePlan functions unchanged ...

    const subjectUnits = processSubjectWisePlan(subjectWisePlan);
    const chapterUnits = processChapterWisePlan(chapterWisePlan);

    await SubjectUnit.bulkCreate([...subjectUnits, ...chapterUnits]);

    // ✅ PASS PAYWALL INFO BACK (for consistency)
    res.status(201).json({
      message: "Recommended test and plans created successfully",
      data: newTest,
      paywallActive: false,           // ✅ Test started successfully
      remainingFreeUses: 2,           // ✅ Full access
    });
    
  } catch (error) {
    console.error("Error creating recommended test:", error);
    res.status(500).json({
      message: "Error creating recommended test",
      error: error.message,
    });
  }
};


const GetRecoTestByid = async (req, res) => {
  try {
    // Validate if req.user exists and holds an id
    if (!req.user || !req.user.id) {
      console.error("Validation failed: Missing studentId");
      return res.status(400).json({
        message: "Validation error: Student ID is required",
        requiredFields: ["studentId"],
      });
    }
    
    // ✅ ADD PAYWALL INFO TO RESPONSE
    const paywallActive = req.paywallActive || false;
    const remainingFreeUses = req.remainingFreeUses || 2;
    
    console.log("🛑 Paywall status:", { paywallActive, remainingFreeUses });

    // Step 1: Fetch the recommended tests for the given studentId
    const recommendedTests = await RecommendedTest.findAll({
      where: {
        studentId: req.user.id,
      },
    });

    // Step 2: Check if no recommended tests are found
    if (!recommendedTests.length) {
      return res.status(404).json({
        message: "No recommended tests found for the specified student.",
      });
    }
    
    const testsWithUnits = [];
    for (const test of recommendedTests) {
      const units = await SubjectUnit.findAll({
        where: {
          recommendedTestId: test.id,
        },
      });
      
      testsWithUnits.push({
        test,
        units,
      });
    }

    const formattedData = testsWithUnits.map(({ test, units }) => ({
      testId: test.id,
      studentId: test.studentId,
      difficultyLevel: test.difficultyLevel || "Medium",
      recommendedBy: test.recommendedBy || "System",
      testName: test.testName || "Custom Test",
      status: test.status || "pending",
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      subjectWisePlan: units.reduce((acc, unit) => {
        if (!acc[unit.subject]) {
          acc[unit.subject] = [];
        }
        acc[unit.subject].push({
          chapter: unit.unitName,
          weightage: unit.weightage,
          expected_questions: unit.expectedQuestions,
          difficulty: unit.difficulty,
          allocated_time: unit.timeToComplete,
          focus_priority: unit.focusPriority,
          recommended_tests: unit.recommendedTests,
        });
        return acc;
      }, {}),
    }));

    // ✅ SEND PAYWALL INFO WITH DATA
    return res.status(200).json({
      message: "Recommended tests retrieved successfully",
      data: formattedData,
      paywallActive,           // ✅ Frontend overlay trigger
      remainingFreeUses,       // ✅ "0/2 used" display
    });
    
  } catch (error) {
    console.error("Error fetching recommended tests:", error);
    return res.status(500).json({
      message: "Error fetching recommended tests",
      error: error.message,
    });
  }
};


export {getAllDataFromSchema, GetRecoTestByid, CreateEntry}
