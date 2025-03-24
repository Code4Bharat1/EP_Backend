import { Op } from "sequelize";
import College from "../models/collegepredictor.model.js";

export const predictColleges = async (req, res) => {
  try {
    const { state, course, airRank, category } = req.body;

    if (!state || !course || !airRank || !category) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const categoryMap = {
      GEN: "gen_cutoff",
      EWS: "ews_cutoff",
      OBC: "obc_cutoff",
      SC: "sc_cutoff",
      ST: "st_cutoff",
    };

    const cutoffColumn = categoryMap[category.toUpperCase()];
    if (!cutoffColumn) {
      return res.status(400).json({ error: "Invalid category" });
    }

    // 🔍 Make state and course lowercase and compare with LOWER() in DB
    const colleges = await College.findAll({
      where: {
        [Op.and]: [
          // Case-insensitive match for state and course
          { state: { [Op.like]: state } },
          { course: { [Op.like]: course } },

          // Cutoff condition (your AIR must be LESS than or equal to cutoff)
          {
            [cutoffColumn]: {
              [Op.gte]: airRank,
            },
          },
        ],
      },
    });

    if (colleges.length === 0) {
      return res.status(404).json({ error: "No colleges found matching the criteria." });
    }

    res.json({ colleges });
  } catch (error) {
    console.error("❌ Error in predictColleges:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// 🎯 2. Get all distinct States
export const getStates = async (req, res) => {
  try {
    const states = await College.findAll({
      attributes: ["state"],
      group: ["state"],
    });

    res.json({ states: states.map((s) => s.state) });
  } catch (err) {
    console.error("Error in getStates:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🎯 3. Get all distinct Courses for a given state
export const getCourses = async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) return res.status(400).json({ error: "State is required" });

    const courses = await College.findAll({
      where: { state },
      attributes: ["course"],
      group: ["course"],
    });

    res.json({ courses: courses.map((c) => c.course) });
  } catch (err) {
    console.error("Error in getCourses:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🎯 4. Get all categories (fixed)
export const getCategories = (req, res) => {
  res.json({ categories: ["GEN", "OBC", "SC", "ST", "EWS"] });
};
