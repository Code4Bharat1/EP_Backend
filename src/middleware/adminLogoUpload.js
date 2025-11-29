import multer from "multer";
import path from "path";

// Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/adminLogos");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const uploadAdminLogo = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default uploadAdminLogo;
