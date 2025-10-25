import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: String,
  date: Date,
  duration: Number,
  videoUrl: String,
  teacher: String,
}, { timestamps: true });

const Session = mongoose.model("Session", sessionSchema);
export default Session;
