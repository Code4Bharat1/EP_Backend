import axios from 'axios'
import PreviousYearQuestion from "../models/previousyearquestion.model.js";

export const getQuestionsBySubjectAndYear = async (req, res) => {
  try {
    const { subject, year } = req.body;

    if (!subject || !year) {
      return res.status(400).json({
        error: "Both 'subject' and 'year' are required in the request body.",
      });
    }

    const questions = await PreviousYearQuestion.findAll({
      where: {
        Subject: subject,
        Year: year,
      },
    });

    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found." });
    }

    // Prepare payload for Python API
    const payload = questions.map(q => ({
      mcq: q.questions,
      subject: q.Subject
    }));

    // Call Python verification API
    const pythonResponse = await axios.post("http://127.0.0.1:5000/api/verify-subject", payload);
    const verifiedResults = pythonResponse.data;

    // Enrich and optionally update mismatched subjects
    const enriched = await Promise.all(
      questions.map(async (q, index) => {
        const verification = verifiedResults[index];

        if (verification.match === false && verification.recommended_subject) {
          // Update subject in DB
          await PreviousYearQuestion.update(
            { Subject: verification.recommended_subject },
            { where: { id: q.id } }
          );
          // Also reflect in the enriched response
          q.Subject = verification.recommended_subject;
        }

        return {
          id: q.id,
          year: q.Year,
          subject: q.Subject,
          mcq: q.questions,
          correctAnswer: q.correctAnswer,
          options: q.options,
          solution: q.solution,
          diagramUrl: q.diagramUrl,
          verification: {
            ...verification,
            subjectBeforeCorrection: subject // Optional: track original
          }
        };
      })
    );

    return res.status(200).json({ questions: enriched });

  } catch (error) {
    console.error("Error verifying or updating questions:", error);
    return res.status(500).json({
      error: "Server error during verification or subject update.",
      details: error.message,
    });
  }
};
