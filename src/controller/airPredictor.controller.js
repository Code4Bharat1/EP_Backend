import fetch from "node-fetch"; // For older Node.js versions
import config from "config";

const FASTAPI_BASE_URL = config.get("airPredictorApi");

// Function to predict AIR rank (without session)
export const getAIRPrediction = async (req, res) => {
  try {
    const { marks, year } = req.body;
    // Validate the marks and year input
    if (typeof marks !== "number" || !Number.isInteger(year)) {
      return res
        .status(400)
        .json({
          error:
            "Invalid input. Marks must be a float and year must be an integer.",
        });
    }
    // Request predicted AIR rank from the FastAPI service
    const response = await fetch(FASTAPI_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marks, year }),
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Error from FastAPI service" });
    }

    const data = await response.json();
    console.log("FastAPI Response:", data);

    const predictedRank = data.predicted_rank;

    // Send the predicted rank back to the client
    res.status(200).json({ predictedRank });
  } catch (error) {
    console.error("Error during fetch request:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
