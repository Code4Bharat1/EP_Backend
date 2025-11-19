import { Op } from "sequelize";
import Student from "../models/student.model.js";

// Controller to get students who haven't logged in for 7 days based on createdAt or updatedAt fields
export const getInactiveStudents = async (req, res) => {
  try {
    const adminId = req.user?.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const students = await Student.findAll({
      where: {
        addedByAdminId: adminId,
        updatedAt: { [Op.lt]: sevenDaysAgo }
      },
      attributes: ["id", "firstName", "lastName", "profileImage"]
    });

    const studentProfiles = students.map(s => ({
      id: s.id,
      fullName: `${s.firstName} ${s.lastName}`,
      profileImage: s.profileImage
    }));

    return res.status(200).json({
      success: true,
      data: {
        studentCount: students.length,
        studentProfiles
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
