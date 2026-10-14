const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure controlled upload directory exists
const uploadDir = path.join(__dirname, '../uploads/certificates');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration with safe randomized filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeRandom = crypto.randomBytes(8).toString('hex');
    const safeFilename = `cert_${Date.now()}_${safeRandom}${ext}`;
    cb(null, safeFilename);
  }
});

// Allowed file extensions and MIME types
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/pjpeg', 'image/x-png'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(mime)) {
    return cb(new Error('Invalid file format. Only PDF, JPG, JPEG, and PNG files are accepted.'));
  }

  cb(null, true);
};

// Multer instance with 5MB limit
const uploadCertificate = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter
});

/**
 * Validate file magic bytes to prevent disguised executable uploads
 */
function validateFileHeader(filePath) {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

    // JPEG: FF D8 FF
    const isJpg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

    return isPdf || isPng || isJpg;
  } catch (err) {
    return false;
  }
}

/**
 * Middleware wrapper to handle upload errors and enforce 5MB limit with clean JSON responses
 */
const handleCertificateUpload = (req, res, next) => {
  uploadCertificate.single('certificate')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Certificate file size exceeds the 5 MB limit.' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Error uploading certificate.' });
    }
    next();
  });
};

module.exports = {
  uploadCertificate,
  handleCertificateUpload,
  validateFileHeader,
  uploadDir
};
