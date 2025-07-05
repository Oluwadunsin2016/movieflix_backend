// backend/middlewares/upload.js
require("dotenv").config();
const multer = require("multer");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = "Netflix_Profile_Pictures";
    const resource_type = file.mimetype.startsWith("video/") ? "video" : "image";
    const public_id = crypto.randomBytes(16).toString("hex"); // Random file name
    const format = file.mimetype.split("/")[1]; // jpg, png, etc.

    return {
      folder,
      format,
      resource_type,
      public_id,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
