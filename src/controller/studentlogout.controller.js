import { Op } from "sequelize";
import Student from "../models/student.model.js";

// Controller to get students who haven't logged in for 7 days based on createdAt or updatedAt fields
export const getInactiveStudents = async (req, res) => {
  try {
    // Get the current date
    const currentDate = new Date();

    // Calculate the date 7 days ago
    const sevenDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 7));

    // Step 1: Find students whose createdAt or updatedAt is older than 7 days
    const inactiveStudents = await Student.findAll({
      where: {
        [Op.or]: [
          {
            createdAt: {
              [Op.lt]: sevenDaysAgo, // Compare createdAt with 7 days ago
            },
          },
          {
            updatedAt: {
              [Op.lt]: sevenDaysAgo, // Compare updatedAt with 7 days ago
            },
          },
        ],
      },
      attributes: ["id", "firstName", "lastName", "profileImage"], // Fetch the necessary fields (id, name, and profileImage)
    });

    // If no students found, return a message
    if (inactiveStudents.length === 0) {
      return res.status(404).json({ message: "No inactive students found." });
    }

    // Step 2: Structure the response for frontend
    const studentProfiles = inactiveStudents.map(student => ({
      id: student.id,
      fullName: `${student.firstName} ${student.lastName}`,
      profileImage: student.profileImage,
    }));

    // Return the list of inactive students and total count
    return res.status(200).json({
      success: true,
      message: "Inactive students fetched successfully",
      data: {
        studentCount: inactiveStudents.length,
        studentProfiles: studentProfiles,
      },
    });
  } catch (error) {
    console.error("Error fetching inactive students:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
