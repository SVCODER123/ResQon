const router = require('express').Router();
const User = require('../models/User');
const SOS = require('../models/SOS');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/volunteers/nearby?lat=&lng=&radius=
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng required' });
    }

    const pLat = Number(lat);
    const pLng = Number(lng);
    const r = Number(radius);

    if (Number.isNaN(pLat) || Number.isNaN(pLng) || Number.isNaN(r)) {
      return res.status(400).json({ message: 'Invalid lat, lng, or radius' });
    }

    // All normal users are treated as volunteers.
    // Admin is excluded.
    const delta = r / 111;

    const users = await User.find({
      _id: { $ne: req.user._id },
      role: 'user',
      isActive: true,
      'location.lat': { $exists: true, $gte: pLat - delta, $lte: pLat + delta },
      'location.lng': { $exists: true, $gte: pLng - delta, $lte: pLng + delta },
    }).select('name email phone role location isActive');

    const nearbyVolunteers = users
      .map((user) => {
        const obj = user.toObject();

        const distanceKm = haversine(
          pLat,
          pLng,
          obj.location.lat,
          obj.location.lng
        );

        return {
          ...obj,
          distanceKm: Number(distanceKm.toFixed(2)),
        };
      })
      .filter((user) => user.distanceKm <= r)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.json({
      success: true,
      count: nearbyVolunteers.length,
      data: nearbyVolunteers,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// POST /api/volunteers/accept/:sosId
router.post('/accept/:sosId', async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.sosId);

    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }

    const alreadyAccepted = sos.responders?.some(
      (responder) =>
        responder.user?.toString() === req.user._id.toString()
    );

    if (!alreadyAccepted) {
      const loc = req.user.location || {};

      sos.responders.push({
        user: req.user._id,
        location: {
          lat: loc.lat,
          lng: loc.lng,
          updatedAt: new Date(),
        },
        acceptedAt: new Date(),
      });

      if (sos.status === 'active') {
        sos.status = 'responding';
      }

      await sos.save();
    }

    const updatedSOS = await SOS.findById(req.params.sosId)
      .populate('user', 'name email phone')
      .populate('responders.user', 'name email phone');

    return res.json({
      success: true,
      data: updatedSOS,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// PUT /api/volunteers/location
router.put('/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: 'lat and lng required' });
    }

    const pLat = Number(lat);
    const pLng = Number(lng);

    if (Number.isNaN(pLat) || Number.isNaN(pLng)) {
      return res.status(400).json({ message: 'Invalid lat or lng' });
    }

    const location = {
      lat: pLat,
      lng: pLng,
      updatedAt: new Date(),
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { location },
      { new: true }
    ).select('name email phone role location');

    await SOS.updateMany(
      {
        'responders.user': req.user._id,
        status: { $in: ['active', 'responding'] },
      },
      {
        $set: {
          'responders.$[elem].location': location,
        },
      },
      {
        arrayFilters: [{ 'elem.user': req.user._id }],
      }
    );

    return res.json({
      success: true,
      data: user,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// GET /api/volunteers/responders/:sosId
router.get('/responders/:sosId', async (req, res) => {
  try {
    const sos = await SOS.findById(req.params.sosId)
      .populate('responders.user', 'name email phone role location');

    if (!sos) {
      return res.status(404).json({ message: 'SOS not found' });
    }

    return res.json({
      success: true,
      data: sos.responders || [],
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

module.exports = router;