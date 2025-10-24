import Session from "../models/sessionModel.js";

export const createSession = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    await global.db.execute("INSERT INTO sessions (title) VALUES (?)", [title]);
    res.status(201).json({ message: "Session created successfully" });
  } catch (err) {
    console.error("❌ Error creating session:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const [rows] = await global.db.execute("SELECT * FROM sessions");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error getting sessions:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const [rows] = await global.db.execute("SELECT * FROM sessions WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
