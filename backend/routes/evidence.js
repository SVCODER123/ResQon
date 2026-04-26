const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SOS = require('../models/SOS');
const { protect } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const getBaseUrl = (req) => {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
};

// ── Multer Storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeExt = ext || '.bin';
    const name = `${req.user._id}_${Date.now()}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 20) * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mp3|m4a|wav|ogg/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype.toLowerCase());

    if (extOk || mimeOk) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});

router.use(protect);

// POST /api/evidence/:sosId
router.post('/:sosId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const sos = await SOS.findById(req.params.sosId);

    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }

    const mime = req.file.mimetype || '';

    const type = mime.startsWith('image')
      ? 'photo'
      : mime.startsWith('video')
      ? 'video'
      : 'audio';

    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${getBaseUrl(req)}${relativeUrl}`;

    sos.evidence.push({
      type,
      url: fullUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
    });

    await sos.save();

    const updated = await SOS.findById(sos._id)
      .populate('evidence.uploadedBy', 'name email phone role')
      .populate('evidence.verifiedBy', 'name email phone role');

    return res.status(201).json({
      success: true,
      data: updated.evidence,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// GET /api/evidence/:sosId
router.get('/:sosId', async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.sosId)
      .populate('evidence.uploadedBy', 'name email phone role')
      .populate('evidence.verifiedBy', 'name email phone role');

    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }

    return res.json({
      success: true,
      data: sos.evidence || [],
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;