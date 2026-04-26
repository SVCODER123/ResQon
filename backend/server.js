require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');

const authRoutes      = require('./routes/auth');
const sosRoutes       = require('./routes/sos');
const volunteerRoutes = require('./routes/volunteers');
const evidenceRoutes  = require('./routes/evidence');
const adminRoutes     = require('./routes/admin');
const userRoutes      = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 5000;
const path = require('path');
// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded evidence files
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/sos',        sosRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/evidence',   evidenceRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/users',      userRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── DB + Start ────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));
  })
  .catch(err => { console.error('❌  MongoDB connection failed:', err); process.exit(1); });
