import {
  Diagram,
  Option,
  Pdf,
  Question,
} from "../models/everytestmode.refrence.js";
import { Op } from "sequelize";
import {RecommendedTest, SubjectUnit, AttemptedRecoTest,} from "../models/recommendedtest.model.js";

const startrecotest = async (req, res) => {
  try {
    const { chapter, allocatedQuestions, testId } = req.query;

    if (!testId || !chapter || !allocatedQuestions) {
      return res.status(400).json({
        error:
          "Missing required parameters: testId, chapter, or allocatedQuestions",
      });
    }

    console.log("Received request with parameters:", {
      testId,
      chapter,
      allocatedQuestions,
    });

    const test = await RecommendedTest.findOne({ where: { id: testId } });
    if (!test) return res.status(404).json({ error: "Test not found" });
    const unit = await SubjectUnit.findOne({
      where: { recommendedTestId: testId, unitName: chapter },
    });
    if (!unit) return res.status(404).json({ error: "Unit not found" });
    // console.log("Unit Data:", unit);
    // 🔥 Modified: Fetch PDFs where `topic_tags` match `chapter` OR `simplifiedChapter`
    const simplifiedChapter = chapter.includes(":")
      ? chapter.split(":")[1].trim()
      : chapter;

    const getpfg = await Pdf.findAll({
      where: {
        topic_tags: {
          [Op.or]: [chapter, simplifiedChapter],
        },},});

    if (getpfg.length === 0)
      return res.status(404).json({ error: "No PDFs found for the chapter" });
    console.log("Retrieved PDFs:", getpfg);
    let questionwithoptions = [];
    for (const pdf of getpfg) {
      const realquestions = await Question.findAll({
        where: { pdf_id: pdf.id },
      });
      // console.log("Questions fetched for PDF:", realquestions);

      for (const question of realquestions) {
        const [options, diagrams] = await Promise.all([
          Option.findAll({ where: { question_id: question.id } }),
          Diagram.findAll({ where: { question_id: question.id } }),
        ]);

        questionwithoptions.push({
          question: question.dataValues,
          options: options.map((option) => option.dataValues),
          diagram: diagrams.length ? diagrams[0].dataValues.diagram_path : null,
        });
      }
    }

    const numQuestions = parseInt(allocatedQuestions, 10);
    if (isNaN(numQuestions) || numQuestions <= 0) {
      return res
        .status(400)
        .json({ error: "Invalid value for allocatedQuestions" });
    }

    const questionwithoptionstosend = questionwithoptions.slice(
      0,
      numQuestions
    );
    console.log("Data to send to frontend:", {
      pdfs: getpfg,
      questions: questionwithoptionstosend,
    });
    return res.json({ pdfs: getpfg, questions: questionwithoptionstosend });
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({ error: error.message });
  }
};

const getrcoequestions = async (req, res) => {
  // console.log("Received request body:", req.query);
  try {
    const { chapter, allocatedQuestions } = req.query;
    if (!chapter || !allocatedQuestions) {
      return res.status(400).json({
        error: "Missing required parameters: chapter or allocatedQuestions",
      });
    }

    // 🔥 Modified: Use `simplifiedChapter` along with `chapter` for fetching PDFs
    const simplifiedChapter = chapter.includes(":")
      ? chapter.split(":")[1].trim()
      : chapter;
    // console.log("Simplified Chapter:", simplifiedChapter);

    const getpfg = await Pdf.findAll({
      where: {
        topic_tags: [chapter, simplifiedChapter], // Fetch PDFs that match either one
      },
    });

    if (getpfg.length === 0)
      return res.status(404).json({ error: "No PDFs found for the chapter" });

    console.log("Retrieved PDFs:", getpfg);

    const getallquestionPromises = getpfg.map((pdf) =>
      Question.findAll({ where: { pdf_id: pdf.id } })
    );
    const getallquestion = await Promise.all(getallquestionPromises);

    let questionwithoptions = [];
    for (const realquestions of getallquestion) {
      console.log("Questions for PDF:", realquestions);

      const [options, diagrams] = await Promise.all([
        Promise.all(
          realquestions.map((q) =>
            Option.findAll({ where: { question_id: q.id } })
          )
        ),
        Promise.all(
          realquestions.map((q) =>
            Diagram.findAll({ where: { question_id: q.id } })
          )
        ),
      ]);

      realquestions.forEach((question, j) => {
        questionwithoptions.push({
          question: question.dataValues,
          options: options[j].map((option) => option.dataValues),
          diagram: diagrams[j].length
            ? diagrams[j][0].dataValues.diagram_path
            : null,
        });
      });
    }

    console.log("All questions and options:", questionwithoptions);
    const questionwithoptionstosend = questionwithoptions.slice(
      0,
      allocatedQuestions
    );
    console.log("Data to send to frontend:", {
      pdfs: getpfg,
      questions: questionwithoptionstosend,
    });
    return res.json({ pdfs: getpfg, questions: questionwithoptionstosend });
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({ error: error.message });
  }
};

const submitrecotest = async (req, res) => {
  try {
    const data = req.body.finalsubmission.payloaddata; // Array of questions with selected options
    console.log("This is reqbody", req.body);
    const chapter = req.body.finalsubmission.chapter;
    const testId = req.body.finalsubmission.testid; // Assuming the testId is passed in the request
    const studentId = req.body.studentId; // Assuming studentId is passed in the request

    // Fetch the test
    const test = await RecommendedTest.findOne({
      where: { id: testId },
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Fetch the unit
    const unit = await SubjectUnit.findOne({
      where: {
        recommendedTestId: testId,
        unitName: chapter,
      },
    });
    console.log("juned here", unit.dataValues);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    let totalMarks = 0;
    const correctanswers = [];
    const wronganswers = [];
    const notattempted = [];

    // Loop through the submitted data
    for (let index = 0; index < data.length; index++) {
      const { question_id, selected_option } = data[index];

      if (selected_option === null) {
        notattempted.push({ question_id });
        continue;
      }

      // Fetch the options for the current question
      const alloptions = await Option.findAll({
        where: { question_id },
      });

      // Find the selected option
      const selectedOptionObj = alloptions.find(
        (option) => option.id === selected_option
      );

      if (selectedOptionObj) {
        if (selectedOptionObj.is_correct) {
          correctanswers.push({ question_id, marks: 4 });
          totalMarks += 4;
        } else {
          wronganswers.push({ question_id, marks: -1 });
          totalMarks -= 1;
        }
      } else {
        notattempted.push({ question_id });
      }
    }

    console.log("Correct answers:", correctanswers);
    console.log("Wrong answers:", wronganswers);
    console.log("Not attempted:", notattempted);
    console.log("Total marks:", totalMarks);

    const numberOfQuestions = data.length;
    const expectedTotalMarks = numberOfQuestions * 4;
    const passingMarks = expectedTotalMarks * 0.6;

    let updateRecommendedTests = false;
    let updatedRecommendedTests = unit.recommendedTests;

    if (totalMarks >= 0 && totalMarks < passingMarks) {
      updatedRecommendedTests = Math.max(0, unit.recommendedTests - 1);
      updateRecommendedTests = true;
      console.log(
        `Decreasing recommendedTests to ${updatedRecommendedTests} for failing marks`
      );
    }
    console.log("here's the recomemendet test =", updatedRecommendedTests);
    try {
      unit.recommendedTests = updatedRecommendedTests;
      await unit.save();
      console.log(
        "Updated unit recommendedTests successfully:",
        updatedRecommendedTests
      );
    } catch (err) {
      console.error("Error saving updated recommendedTests:", err);
    }
    test.status = "submitted";
    test.correctanswer = correctanswers;
    test.wronganswer = wronganswers;
    test.notattempted = notattempted;
    test.total_marks = totalMarks;
    await test.save();
    const id = req.user.id;
    const attemptedTest = await AttemptedRecoTest.create({
      studentId: id,
      recommendedTestId: testId,
      correctAnswers: correctanswers,
      wrongAnswers: wronganswers,
      notAttempted: notattempted,
      totalMarks: totalMarks,
      status: "completed",
    });

    console.log("Attempted test entry created:", attemptedTest);

    return res.json({
      totalMarks,
      correctanswers,
      wronganswers,
      notattempted,
      updateRecommendedTests,
      updatedRecommendedTests,
      attemptedTest,
    });
  } catch (error) {
    console.error("Error in submitrecotest:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getTestResult = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({ error: "Test ID is required" });
    }
    const testAttempt = await AttemptedRecoTest.findOne({
      where: { id : testId },
    });

    if (!testAttempt) {
      return res.status(404).json({ error: "Test result not found" });
    }
    const resultData = {
      testId: testAttempt.test_id,
      score: testAttempt.score,
      totalMarks: testAttempt.total_marks,
      correctAnswers: testAttempt.correct_answers,
      incorrectAnswers: testAttempt.incorrect_answers,
      unattempted: testAttempt.unattempted,
    };
    return res.json({ resultData });
  } catch (error) {
    console.error("Error fetching test result:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { startrecotest, getrcoequestions, submitrecotest, getTestResult };
