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

// ☁️ Cloudinary Storage for Company Documents (GST, PAN, TAN)
const companyDocsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hrms/company_docs",
    allowed_formats: ["jpg", "png", "webp", "pdf"],
    resource_type: "auto",
  },
});

export const uploadCompanyDocuments = multer({
  storage: companyDocsStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});


// File filter for employee documents
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only image and PDF files are allowed"), false);
  }
};

const employeeDocsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, employeeDocsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?.id || "user";
    const field = (file.fieldname || "doc").replace(/[^a-zA-Z0-9_-]/g, "");
    const uniqueName = `${userId}_${field}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

export const uploadEmployeeDocuments = multer({
  storage: employeeDocsStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
