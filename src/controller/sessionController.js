import Session from "../models/sessionModel.js";

// 🟢 Create a new session
export const createSession = async (req, res) => {
  try {
    const session = await Session.create(req.body);
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🟣 Get all sessions
export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find().sort({ date: 1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔵 Get single session by ID
export const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
