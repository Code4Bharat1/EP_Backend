import fetch from "node-fetch";
import config from "config";

const FASTAPI_BASE_URL = config.get("airPredictorApi"); // Ensure this is set in config/default.json

// Function to predict AIR rank
export const getAIRPrediction = async (req, res) => {
  try {
    const { marks } = req.body;

    // Validate the marks input
    if (typeof marks !== "number") {
      return res.status(400).json({
        error: "Invalid input. Marks must be a number.",
      });
    }

    // Request predicted AIR rank from the FastAPI service
    const response = await fetch(`${FASTAPI_BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marks }),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Error from FastAPI service",
      });
    }

    // Parse response
    const data = await response.json();
    console.log("FastAPI Response:", data);

    // Extract only the predicted_air field
    const predictedRank = data.predicted_air;

    if (predictedRank === undefined) {
      return res.status(500).json({ error: "Prediction data missing from FastAPI response" });
    }

    // Send only `predicted_air` to the frontend
    res.status(200).json({ predicted_air: predictedRank });

  } catch (error) {
    console.error("Error during fetch request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
