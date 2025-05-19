import QuestionReview from "../models/reviewquestion.model.js";

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

export default reviewquestion