import QuestionReview from "../models/reviewquestion.model.js";
import FullTestResults from '../models/fullTestResults.model.js'
import generateTestResult from '../models/generateTestresult.model.js'
import MeTest from '../models/saved.js'

const reviewquestion = async(req, res) => {
    try {

        const {
            question_Id,
            question_Text,
            subject_Name,
            admin_Id,
            chapter_Name,
         } = req.body;

         if(!question_Id || !question_Text || !subject_Name || !admin_Id || !chapter_Name) {
            return res.status(404).json({message : "All fields are not sent..."});
         }

         const newReview = await QuestionReview.create({
            question_Id,
            question_Text,
            subject_Name,
            admin_Id,
            chapter_Name,
         });

         return res.status(201).json({
            message: "Question saved successfully",
            data : newReview
         })

    }catch(error) {
        console.error("Error saving the reviewedquestion", error);
        return res.status(500).json({
            message : "Internal Server Error",
            error : error.message,
        })
    }
}



// controller for credit system of cookies
export const getCombinedTestResults = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // Fetch data from all three models in parallel
    const [fullTests, generatedTests, meTests] = await Promise.all([
      FullTestResults.findAll({
        where: { studentId },
        attributes: ['testName', 'createdAt', 'marksObtained'],
        order: [['createdAt', 'DESC']]
      }),
      generateTestResult.findAll({
        where: { studentId },
        attributes: ['testname', 'createdAt', 'score'],
        order: [['createdAt', 'DESC']]
      }),
      MeTest.findAll({
        where: { studentId },
        attributes: ['testName', 'createdAt', 'score'],
        order: [['createdAt', 'DESC']]
      })
    ]);

    // Calculate totals
    const fullTestTotal = fullTests.reduce((sum, test) => sum + test.marksObtained, 0);
    const generatedTestTotal = generatedTests.reduce((sum, test) => sum + test.score, 0);
    const meTestTotal = meTests.reduce((sum, test) => sum + test.score, 0);
    const overallTotal = fullTestTotal + generatedTestTotal + meTestTotal;

    // Format the response
    const response = {
      fullTests: fullTests.map(test => ({
        testName: test.testName,
        createdAt: test.createdAt,
        marksObtained: test.marksObtained,
        type: 'Full Test'
      })),
      generatedTests: generatedTests.map(test => ({
        testName: test.testname,
        createdAt: test.createdAt,
        score: test.score,
        type: 'Generated Test'
      })),
      meTests: meTests.map(test => ({
        testName: test.testName,
        createdAt: test.createdAt,
        score: test.score,
        type: 'Me Test'
      })),
      totals: {
        fullTestTotal,
        generatedTestTotal,
        meTestTotal,
        overallTotal
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching combined test results:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

export default reviewquestion