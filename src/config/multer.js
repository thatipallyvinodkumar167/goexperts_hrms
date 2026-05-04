import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadDir = "uploads/profiles";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const companyDocsDir = "uploads/company-docs";
if (!fs.existsSync(companyDocsDir)) {
  fs.mkdirSync(companyDocsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${req.user.id}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter — only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, png, webp, gif)"), false);
  }
};

export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const companyDocsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, companyDocsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const companyId = req.params.id || req.user?.companyId || "company";
    const field = (file.fieldname || "doc").replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueName = `${companyId}_${field}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

export const uploadCompanyDocuments = multer({
  storage: companyDocsStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
