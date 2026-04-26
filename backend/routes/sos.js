const router = require('express').Router();
const SOS    = require('../models/SOS');
const { protect } = require('../middleware/auth');

// All SOS routes require auth
router.use(protect);

// POST /api/sos/trigger
router.post('/trigger', async (req, res) => {
  try {
    const { incidentType, lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ message: 'Location required' });

    // Cancel any existing active SOS for this user first
    await SOS.updateMany(
      { user: req.user._id, status: { $in: ['active', 'pending', 'responding'] } },
      { status: 'cancelled' },
    );

    const sos = await SOS.create({
      user: req.user._id,
      incidentType: incidentType || 'Other',
      status: 'active',
      location: { lat, lng },
      locationHistory: [{ lat, lng }],
    });

    const populated = await SOS.findById(sos._id).populate('user', 'name phone email');
    res.status(201).json({ sos: populated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/sos/active  — all non-resolved incidents (for map + volunteer feed)
router.get('/active', async (req, res) => {
  try {
    const incidents = await SOS.find({
      status: { $in: ['active', 'pending', 'responding'] },
    })
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ data: incidents });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/sos/:id
router.get('/:id', async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id)
      .populate('user',                  'name phone email')
      .populate('verifications.user',    'name')
      .populate('evidence.uploadedBy',   'name')
      .populate('evidence.verifiedBy',   'name')
      .populate('responders.user',       'name phone')
      .populate('routedBy',              'name')
      .populate('resolvedBy',            'name');
    if (!sos) return res.status(404).json({ message: 'SOS not found' });
    res.json({ data: sos });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/sos/:id/location  — live location update
router.put('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const sos = await SOS.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        'location.lat': lat,
        'location.lng': lng,
        $push: { locationHistory: { lat, lng } },
      },
      { new: true },
    );
    if (!sos) return res.status(404).json({ message: 'SOS not found' });
    res.json({ data: sos });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/sos/:id/verify  — volunteer verifies the incident
router.post('/:id/verify', async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.id);
    if (!sos) return res.status(404).json({ message: 'SOS not found' });

    // Prevent duplicate verifications by same user
    const already = sos.verifications.some(v => v.user?.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ message: 'Already verified' });

    sos.verifications.push({ user: req.user._id, confirmed: req.body.confirmed !== false });
    await sos.save();

    const updated = await SOS.findById(sos._id)
      .populate('verifications.user', 'name');
    res.json({ data: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/sos/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const sos = await SOS.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'cancelled' },
      { new: true },
    );
    if (!sos) return res.status(404).json({ message: 'SOS not found' });
    res.json({ data: sos });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/sos/:id/resolve  (user self-resolve)
router.post('/:id/resolve', async (req, res) => {
  try {
    const sos = await SOS.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user._id },
      { new: true },
    );
    if (!sos) return res.status(404).json({ message: 'SOS not found' });
    res.json({ data: sos });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
