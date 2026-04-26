const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmed: { type: Boolean, default: true },
}, { timestamps: true });

const evidenceSchema = new mongoose.Schema({
  type:       { type: String, enum: ['photo', 'video', 'audio'], required: true },
  url:        { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verified:   { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const responderSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { lat: Number, lng: Number },
  acceptedAt: { type: Date, default: Date.now },
});

const sosSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  incidentType: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'responding', 'resolved', 'cancelled'],
    default: 'active',
  },

  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },

  // Location history for tracking
  locationHistory: [
    { lat: Number, lng: Number, ts: { type: Date, default: Date.now } },
  ],

  verifications: [verificationSchema],
  evidence:      [evidenceSchema],
  responders:    [responderSchema],

  routedTo:  String,  // agency/note from admin
  routedAt:  Date,
  routedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Index for geospatial-like queries (lat/lng stored as flat numbers for simplicity)
sosSchema.index({ status: 1, createdAt: -1 });
sosSchema.index({ 'location.lat': 1, 'location.lng': 1 });

module.exports = mongoose.model('SOS', sosSchema);
