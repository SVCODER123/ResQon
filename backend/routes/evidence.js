const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const SOS    = require('../models/SOS');
const { protect } = require('../middleware/auth');

// ── Multer Storage ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${req.user._id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 20) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mp3|m4a|wav|ogg/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
            || allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Unsupported file type'));
  },
});

router.use(protect);

// POST /api/evidence/:sosId
router.post('/:sosId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const sos = await SOS.findById(req.params.sosId);
    if (!sos) return res.status(404).json({ message: 'SOS not found' });

    const mime = req.file.mimetype;
    const type = mime.startsWith('image') ? 'photo'
               : mime.startsWith('video') ? 'video'
               : 'audio';

    const url = `/uploads/${req.file.filename}`;
    sos.evidence.push({ type, url, uploadedBy: req.user._id });
    await sos.save();

    const updated = await SOS.findById(sos._id).populate('evidence.uploadedBy', 'name');
    res.status(201).json({ data: updated.evidence });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/evidence/:sosId
router.get('/:sosId', async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.sosId)
      .populate('evidence.uploadedBy', 'name')
      .populate('evidence.verifiedBy', 'name');
    if (!sos) return res.status(404).json({ message: 'SOS not found' });
    res.json({ data: sos.evidence });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
