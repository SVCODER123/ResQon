const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const sign = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').notEmpty().withMessage('Phone is required').trim(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return res.status(400).json({ message: errs.array()[0].msg });
    }

    try {
      const name = req.body.name?.trim();
      const email = req.body.email?.trim().toLowerCase();
      const phone = req.body.phone?.trim();
      const password = req.body.password;

      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = await User.create({
        name,
        email,
        phone,
        password,
      });

      return res.status(201).json({
        user: sanitizeUser(user),
        token: sign(user._id),
      });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      return res.status(400).json({ message: errs.array()[0].msg });
    }

    try {
      const email = req.body.email?.trim().toLowerCase();
      const password = req.body.password;

      // IMPORTANT: include password hash if schema uses select: false
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const ok = await user.comparePassword(password);

      if (!ok) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      return res.json({
        user: sanitizeUser(user),
        token: sign(user._id),
      });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
);

module.exports = router;