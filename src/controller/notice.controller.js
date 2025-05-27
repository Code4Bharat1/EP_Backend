import NoticeSection from "../models/notice.model.js";
import Student from "../models/student.model.js";

const createNotice = async (req, res) => {
  try {
    const {
      adminId,
      noticeText,
      noticeTitle,
      noticeStartDate,
      noticeEndDate,
      batchName,
    } = req.body;

    if (
      !adminId ||
      !noticeText ||
      !noticeTitle ||
      !noticeStartDate ||
      !noticeEndDate ||
      !batchName
    ) {
      return res.status(400).json({
        message: "All fields are required.",
      });
    }

    const newNotice = await NoticeSection.create({
      adminId,
      noticeText,
      noticeTitle,
      noticeStartDate,
      noticeEndDate,
      batchName,
    });

    return res.status(201).json({
      message: "Notice created successfully.",
      notice: newNotice,
    });

  } catch (error) {
    console.error("Error creating notice:", error);
    return res.status(500).json({
      message: "Server error while creating notice.",
    });
  }
};


export const getNoticesByAdmin = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: "adminId is required." });
    }

    const notices = await NoticeSection.findAll({
      where: { adminId },
      order: [['createdAt', 'DESC']], 
    });

    return res.status(200).json({ notices });

  } catch (error) {
    console.error("Error fetching notices by adminId:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const updateNotice = async (req, res) => {
  try {
    const {
      id,
      adminId,
      noticeText,
      noticeTitle,
      noticeStartDate,
      noticeEndDate,
      batchName,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Notice ID is required." });
    }

    const notice = await NoticeSection.findByPk(id);
    if (!notice) {
      return res.status(404).json({ message: "Notice not found." });
    }

    if (adminId !== undefined) notice.adminId = adminId;
    if (noticeText !== undefined) notice.noticeText = noticeText;
    if (noticeTitle !== undefined) notice.noticeTitle = noticeTitle;
    if (noticeStartDate !== undefined) notice.noticeStartDate = noticeStartDate;
    if (noticeEndDate !== undefined) notice.noticeEndDate = noticeEndDate;
    if (batchName !== undefined) notice.batchName = batchName;

    await notice.save();

    return res.status(200).json({
      message: "Notice updated successfully.",
      notice,
    });
  } catch (error) {
    console.error("Error updating notice:", error);
    return res.status(500).json({
      message: "Server error while updating notice.",
    });
  }
};

export const getStudentNotices = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required." });
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const adminId = student.addedByAdminId;

    if (!adminId) {
      return res.status(404).json({ message: "No admin assigned to this student." });
    }

    const notices = await NoticeSection.findAll({
      where: { adminId },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ adminId, notices });

  } catch (error) {
    console.error("Error fetching notices for student:", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.body;

    console.log(id);

    if (!id) {
      return res.status(400).json({ message: "Notice ID is required." });
    }

    const notice = await NoticeSection.findByPk(id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found." });
    }

    await notice.destroy();

    return res.status(200).json({
      message: "Notice deleted successfully.",
    });

  } catch (error) {
    console.error("Error deleting notice:", error);
    return res.status(500).json({ message: "Server error while deleting notice." });
  }
};


export default createNotice;
