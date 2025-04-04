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
    console.log(data);
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
};

// Function to calculate allocated time and questions for each subject and chapter
const generateTestPlan = (
  targetMarks,
  weakSubject,
  strongSubject,
  availableTime
) => {
  const allocatedMarks = {};

  // Rule-based allocation of marks for strong and weak subjects
  if (strongSubject === "Chemistry") {
    allocatedMarks["Chemistry"] = 180;
    let remainingMarks = targetMarks - 180;
    if (weakSubject === "Biology") {
      allocatedMarks["Physics"] = Math.min(remainingMarks * 0.55, 180);
      allocatedMarks["Biology"] =
        targetMarks - allocatedMarks["Chemistry"] - allocatedMarks["Physics"];
    } else if (weakSubject === "Physics") {
      allocatedMarks["Biology"] = Math.min(remainingMarks * 0.55, 360);
      allocatedMarks["Physics"] =
        targetMarks - allocatedMarks["Chemistry"] - allocatedMarks["Biology"];
    }
  } else if (strongSubject === "Biology") {
    allocatedMarks["Biology"] = 360;
    let remainingMarks = targetMarks - 360;
    if (remainingMarks < 0) {
      allocatedMarks["Biology"] = targetMarks * 0.5;
      allocatedMarks["Chemistry"] = targetMarks * 0.25;
      allocatedMarks["Physics"] = targetMarks * 0.25;
    } else if (weakSubject === "Physics") {
      allocatedMarks["Chemistry"] = Math.min(remainingMarks * 0.55, 180);
      allocatedMarks["Physics"] =
        targetMarks - allocatedMarks["Biology"] - allocatedMarks["Chemistry"];
    } else if (weakSubject === "Chemistry") {
      allocatedMarks["Physics"] = Math.min(remainingMarks * 0.55, 180);
      allocatedMarks["Chemistry"] =
        targetMarks - allocatedMarks["Biology"] - allocatedMarks["Physics"];
    }
  } else if (strongSubject === "Physics") {
    allocatedMarks["Physics"] = 180;
    let remainingMarks = targetMarks - 180;
    if (weakSubject === "Chemistry") {
      allocatedMarks["Biology"] = Math.min(remainingMarks * 0.55, 360);
      allocatedMarks["Chemistry"] =
        targetMarks - allocatedMarks["Physics"] - allocatedMarks["Biology"];
    } else if (weakSubject === "Biology") {
      allocatedMarks["Chemistry"] = Math.min(remainingMarks * 0.55, 180);
      allocatedMarks["Biology"] =
        targetMarks - allocatedMarks["Physics"] - allocatedMarks["Chemistry"];
    }
  }
  // Prepare the subject and chapter-wise plan
  const subjectWisePlan = {};
  const chapterWisePlan = [];

  // Loop through the allocated marks for each subject
  for (const [subject, marks] of Object.entries(allocatedMarks)) {
    if (!(subject in syllabus)) continue;
    const chapters = syllabus[subject];
    const totalWeightage = Object.values(chapters).reduce(
      (acc, chapter) => acc + Number(chapter.weightage),
      0
    );
    const subjectPlan = [];
    const totalTime = availableTime * (marks / targetMarks);
    // Loop through each chapter to calculate the allocated questions and time
    for (const [chapter, details] of Object.entries(chapters)) {
      const chapterWeightage = Number(details.weightage);
      const allocatedMarksChapter = Math.max(
        1,
        Math.floor((chapterWeightage / totalWeightage) * marks)
      );
      const allocatedQuestions = Math.floor(allocatedMarksChapter / 4); // Assuming each question is worth 4 marks
      const allocatedTime = totalTime * (allocatedMarksChapter / marks);

      const chapterPlan = {
        chapter,
        allocated_questions: allocatedQuestions,
        allocated_time: `${allocatedTime.toFixed(2)} days`, // Round to 2 decimal places
        recommended_tests: Math.max(1, Math.floor(allocatedQuestions / 3)), // 1 test per 3 questions
      };

      subjectPlan.push(chapterPlan);
      chapterWisePlan.push(chapterPlan);
    }

    subjectWisePlan[subject] = { chapters: subjectPlan };
  }
  return { subjectWisePlan, chapterWisePlan };
};

const CreateEntry = async (req, res) => {
  try {
    const { target_marks, weak_subject, strong_subject, available_time } =
      req.body;

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
      difficultyLevel: getRandomDifficulty(), // Assign a random difficulty level
      testName: "System Test", // Adjust as needed
      status: "pending",
    });

    function getRandomDifficulty() {
      const difficulties = ["hard", "medium", "easy"];
      const randomIndex = Math.floor(Math.random() * difficulties.length);
      return difficulties[randomIndex];
    }

    // Process subject-wise plan: For each subject, iterate over its chapters.
    const processSubjectWisePlan = (subjectWisePlan) => {
      const units = [];
      for (const [subjectName, subjectData] of Object.entries(
        subjectWisePlan
      )) {
        if (subjectData?.chapters && Array.isArray(subjectData.chapters)) {
          for (const chapter of subjectData.chapters) {
            // Get the syllabus data for the chapter to retrieve weightage and focus priority
            const chapterData = syllabus[subjectName]?.[chapter.chapter];
            const weightage = chapterData?.weightage || 0;
            const focusPriority = chapterData?.focus_priority || "Medium";
            units.push({
              recommendedTestId: newTest.id,
              subject: subjectName,
              unitName: chapter.chapter,
              weightage: weightage,
              expectedQuestions: chapter.allocated_questions + 4 || 0,
              difficulty: chapter.difficulty || "Medium", // Default value
              timeToComplete: chapter.allocated_time || "0 days",
              focusPriority: focusPriority, // Using focus_priority from the syllabus
              recommendedTests: chapter.recommended_tests + 1 || 0,
            });
          }
        }
      }
      return units;
    };

    const subjectUnits = processSubjectWisePlan(subjectWisePlan);

    // Process chapter-wise plan: If there is an overall chapter plan, label the subject as "General"
    const processChapterWisePlan = (chapterWisePlan) => {
      return chapterWisePlan.map((chapter) => ({
        recommendedTestId: newTest.id,
        subject: "General",
        unitName: chapter.chapter,
        weightage: chapter.allocated_questions || 0,
        expectedQuestions: chapter.allocated_questions + 4 || 0,
        difficulty: getRandomDifficulty(), // Default value for chapter-wise entries
        timeToComplete: chapter.allocated_time || "0 days",
        focusPriority: "Medium", // Default value
        recommendedTests: chapter.recommended_tests + 1 || 0,
      }));
    };

    const chapterUnits = processChapterWisePlan(chapterWisePlan);

    // Save all unit entries via a bulk insert
    await SubjectUnit.bulkCreate([...subjectUnits, ...chapterUnits]);

    res.status(201).json({
      message: "Recommended test and plans created successfully",
      data: newTest,
    });
  } catch (error) {
    console.error("Error creating recommended test:", error);
    res.status(500).json({
      message: "Error creating recommended test",
      error: error.message,
    });
  }
};

// Get all recommended tests for a specific student along with their units
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
    // Step 1: Fetch the recommended tests for the given studentId
    const recommendedTests = await RecommendedTest.findAll({
      where: {
        studentId: req.user.id, // The studentId to filter the tests
      },
    });
    console.log(recommendedTests);
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
          recommendedTestId: test.id, // Match the recommendedTestId with the current test's ID
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
      // Group the subject units by subject for clarity
      subjectWisePlan: units.reduce((acc, unit) => {
        // Use the subject as key. If the key doesn't exist, create it with an empty array.
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

    // console.log("Formatted data to send:", formattedData);

    // Step 5: Send the response
    return res.status(200).json({
      message: "Recommended tests retrieved successfully",
      data: formattedData,
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
