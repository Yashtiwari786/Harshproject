const multer = require('multer');
const path = require('path');
const fs = require('fs');

// On Vercel (and all serverless/read-only environments), ALWAYS use memory storage.
// On local development, use disk storage so files persist between requests.
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

let storage;

if (isServerless) {
  // Memory storage: files are kept in RAM as Buffer — no disk writes
  storage = multer.memoryStorage();
} else {
  // Disk storage for local development
  const uploadDir = path.join(__dirname, '../../frontend/uploads');
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (e) {
    console.warn('[Upload] Could not create local uploads dir:', e.message);
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `l2f-${uniqueSuffix}${ext}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);
  if (extName && mimeType) return cb(null, true);
  cb(new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed!'), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

module.exports = upload;
