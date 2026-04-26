const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const SOS    = require('../models/SOS');
const { protect } = require('../middleware/auth');
const { cloudinary, isCloudinaryConfigured, missingVars } = require('../utils/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 20) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|avi|webm|mp3|m4a|wav|ogg/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase())
            || allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Unsupported file type'));
  },
});

const uploadBufferToCloudinary = ({ buffer, originalname, mimetype, userId, sosId, type }) =>
  new Promise((resolve, reject) => {
    const extension = path.extname(originalname || '').replace('.', '');

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || 'resqon/evidence',
        resource_type: 'auto',
        public_id: `${userId}_${sosId}_${Date.now()}`,
        format: extension || undefined,
        tags: ['resqon', 'evidence', type],
        context: `sos_id=${sosId}|uploaded_by=${userId}|mime_type=${mimetype}`,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      },
    );

    stream.end(buffer);
  });

router.use(protect);

// POST /api/evidence/:sosId
router.post('/:sosId', upload.single('file'), async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      return res.status(500).json({
        message: `Cloudinary is not configured. Missing env vars: ${missingVars.join(', ')}`,
      });
    }

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const sos = await SOS.findById(req.params.sosId);
    if (!sos) return res.status(404).json({ message: 'SOS not found' });

    const mime = req.file.mimetype;
    const type = mime.startsWith('image') ? 'photo'
               : mime.startsWith('video') ? 'video'
               : 'audio';

    const uploaded = await uploadBufferToCloudinary({
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      userId: req.user._id.toString(),
      sosId: sos._id.toString(),
      type,
    });

    const url = uploaded.secure_url;
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
