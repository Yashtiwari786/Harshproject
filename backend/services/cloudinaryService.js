const { cloudinary, isConfigured } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

/**
 * Upload a single file to Cloudinary.
 * Supports both:
 *   - Memory storage (Vercel): file has .buffer (Buffer)
 *   - Disk storage (local): file has .path (string)
 */
const uploadSingleToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'image',
    };

    if (file.buffer) {
      // Memory storage (Vercel serverless) — stream buffer directly
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(file.buffer);
    } else if (file.path) {
      // Disk storage (local dev) — upload from file path
      cloudinary.uploader.upload(file.path, uploadOptions)
        .then((result) => {
          // Clean up temp file after upload
          try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) {}
          resolve(result);
        })
        .catch(reject);
    } else {
      reject(new Error('File has neither buffer nor path — cannot upload to Cloudinary.'));
    }
  });
};

/**
 * Processes uploaded files from multer req.files or req.file
 * Returns an array of { url, publicId } objects
 */
const uploadImages = async (files, folder = 'lost2found/items') => {
  if (!files || files.length === 0) return [];

  const fileArray = Array.isArray(files) ? files : [files];
  const uploadedImages = [];

  for (const file of fileArray) {
    if (isConfigured) {
      try {
        const result = await uploadSingleToCloudinary(file, folder);
        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (err) {
        console.error('[Cloudinary Upload Error]:', err.message);
        // Fallback: use filename-based local URL (only works locally)
        const fileName = file.originalname || 'upload';
        uploadedImages.push({
          url: `/uploads/${Date.now()}-${fileName}`,
          publicId: `local_${Date.now()}`,
        });
      }
    } else {
      // Cloudinary not configured — local fallback URL
      const fileName = file.originalname || 'upload';
      uploadedImages.push({
        url: `/uploads/${Date.now()}-${fileName}`,
        publicId: `local_${Date.now()}`,
      });
    }
  }

  return uploadedImages;
};

module.exports = { uploadImages };
