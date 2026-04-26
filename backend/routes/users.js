const router = require('express').Router();
const User   = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/users/profile
router.get('/profile', async (req, res) => {
  try {
    res.json({ data: req.user });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/users/profile
router.put('/profile', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(phone && { phone }) },
      { new: true },
    );
    res.json({ data: user });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/users/contacts
router.get('/contacts', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('emergencyContacts');
    res.json({ data: user.emergencyContacts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/users/contacts
router.post('/contacts', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone required' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { emergencyContacts: { name, phone } } },
      { new: true },
    );
    res.status(201).json({ data: user.emergencyContacts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/users/contacts/:contactId
router.delete('/contacts/:contactId', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { emergencyContacts: { _id: req.params.contactId } } },
      { new: true },
    );
    res.json({ data: user.emergencyContacts });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
