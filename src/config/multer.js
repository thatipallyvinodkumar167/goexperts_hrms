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
const employeeDocsDir = "uploads/employee-docs";
if (!fs.existsSync(employeeDocsDir)) {
  fs.mkdirSync(employeeDocsDir, { recursive: true });
}

import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinaryConfig.js";

// ☁️ Cloudinary Storage for Profiles
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hrms/profiles",
    allowed_formats: ["jpg", "png", "webp", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

export const uploadProfileImage = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ☁️ Cloudinary Storage for Company Logos
const companyLogoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hrms/company_logos",
    allowed_formats: ["jpg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  },
});

export const uploadCompanyLogo = multer({
  storage: companyLogoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ☁️ Cloudinary Storage for Company Documents (GST / PAN / TAN proofs)
const companyDocsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => ({
    folder: "hrms/company_docs",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type: "auto",
    public_id: `${file.fieldname}_${Date.now()}`,
  }),
});

export const uploadCompanyDocuments = multer({
  storage: companyDocsStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Generic file filter for employee documents
const employeeDocsFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|pdf|doc|docx/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeMap = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true
  };
  
  if (ext && mimeMap[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, png), PDF, and Word documents are allowed"), false);
  }
};

// ☁️ Cloudinary Storage for Employee Documents
const employeeDocsCloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // If it's a doc/docx/pdf, we must use raw or auto resource type
    let resource_type = "auto";
    if (file.mimetype.includes("word") || file.mimetype.includes("pdf")) {
        resource_type = "raw";
    }
    
    return {
      folder: "hrms/employee_docs",
      allowed_formats: ["jpg", "jpeg", "png", "pdf", "doc", "docx"],
      resource_type: resource_type,
      public_id: `${req.user?.id || "user"}_${file.fieldname}_${Date.now()}`,
    };
  },
});

export const uploadEmployeeDocuments = multer({
  storage: employeeDocsCloudStorage,
  fileFilter: employeeDocsFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Size Validation
});

// ☁️ Cloudinary Storage for Attendance Selfies
const attendanceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hrms/attendance_selfies",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 600, height: 600, crop: "limit" }],
  },
});

export const uploadAttendanceSelfie = multer({
  storage: attendanceStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

