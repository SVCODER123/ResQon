const router = require('express').Router();
const SOS = require('../models/SOS');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [active, responding, resolved, cancelled, volunteers, total] =
      await Promise.all([
        SOS.countDocuments({ status: 'active' }),
        SOS.countDocuments({ status: 'responding' }),
        SOS.countDocuments({ status: 'resolved' }),
        SOS.countDocuments({ status: 'cancelled' }),
        User.countDocuments({ role: 'user', isActive: true }),
        SOS.countDocuments(),
      ]);

    res.json({
      data: { active, responding, resolved, cancelled, volunteers, total },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/admin/incidents?status=active,pending
router.get('/incidents', async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;

    const filter = {};
    if (status) filter.status = { $in: status.split(',') };

    const incidents = await SOS.find(filter)
      .populate('user', 'name phone email')
      .populate('verifications.user', 'name phone email')
      .populate('evidence.uploadedBy', 'name phone email role')
      .populate('evidence.verifiedBy', 'name phone email role')
      .populate('responders.user', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await SOS.countDocuments(filter);

    res.json({
      data: incidents,
      total,
      page: Number(page),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/admin/incidents/:id
router.get('/incidents/:id', async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id)
      .populate('user', 'name phone email role')
      .populate('verifications.user', 'name phone email role')
      .populate('evidence.uploadedBy', 'name phone email role')
      .populate('evidence.verifiedBy', 'name phone email role')
      .populate('responders.user', 'name phone email role location')
      .populate('routedBy', 'name phone email role')
      .populate('resolvedBy', 'name phone email role');

    if (!sos) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({ data: sos });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/admin/incidents/:id/route
router.post('/incidents/:id/route', async (req, res) => {
  try {
    const { note, agency } = req.body;

    const sos = await SOS.findByIdAndUpdate(
      req.params.id,
      {
        status: 'responding',
        routedTo: agency || note || 'Emergency team dispatched',
        routedAt: new Date(),
        routedBy: req.user._id,
      },
      { new: true }
    )
      .populate('user', 'name phone email role')
      .populate('responders.user', 'name phone email role')
      .populate('evidence.uploadedBy', 'name phone email role');

    if (!sos) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({ data: sos });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/admin/evidence/:evidId/verify
router.post('/evidence/:evidId/verify', async (req, res) => {
  try {
    const sos = await SOS.findOne({ 'evidence._id': req.params.evidId });

    if (!sos) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    const ev = sos.evidence.id(req.params.evidId);

    if (!ev) {
      return res.status(404).json({ message: 'Evidence not found' });
    }

    ev.verified = true;
    ev.verifiedBy = req.user._id;
    ev.verifiedAt = new Date();

    await sos.save();

    const updatedSOS = await SOS.findById(sos._id)
      .populate('evidence.uploadedBy', 'name phone email role')
      .populate('evidence.verifiedBy', 'name phone email role');

    const updatedEvidence = updatedSOS.evidence.id(req.params.evidId);

    res.json({
      success: true,
      data: updatedEvidence,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/admin/incidents/:id/close
router.post('/incidents/:id/close', async (req, res) => {
  try {
    const sos = await SOS.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
      },
      { new: true }
    )
      .populate('user', 'name phone email role')
      .populate('resolvedBy', 'name phone email role');

    if (!sos) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.json({ data: sos });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;