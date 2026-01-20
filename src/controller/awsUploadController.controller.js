import {S3Client} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

// Configure AWS
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

// Main controller logic for handling file upload
export const handleS3Upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { originalname, mimetype, buffer } = req.file;
    const fileName = `${Date.now()}-${originalname}`;

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: mimetype,
      ACL: "public-read",
    };

    const result = await s3.upload(uploadParams).promise();

    return res.status(200).json({ url: result.Location });
  } catch (error) {
    console.error("S3 upload failed:", error);
    return res.status(500).json({
      message: "Failed to upload file to S3",
      error: error.message,
    });
  }
};
