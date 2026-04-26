import { useState, useEffect, useCallback } from 'react';
import { SOSStore } from '../store/SOSStore';
import { AuthStore } from '../store/AuthStore';
import { sosAPI, userAPI } from '../services/api';
import { LocationService } from '../services/LocationService';
import { SirenService } from '../services/SirenService';
import { SMSService } from '../services/SMSService';

export function useSOS() {
  const [sos,     setSOS]     = useState(SOSStore.getActive());
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    return SOSStore.subscribe(setSOS);
  }, []);

  const triggerSOS = useCallback(async (incidentType = 'Other') => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get location
      const coords = await LocationService.getCurrentPosition();

      // 2. Start siren
      await SirenService.start();

      // 3. POST to backend
      const { data } = await sosAPI.trigger({
        incidentType,
        lat: coords.lat,
        lng: coords.lng,
      });

      await SOSStore.setActive(data.sos);

      // 4. Send SMS to emergency contacts
      try {
        const { data: contactsRes } = await userAPI.getContacts();
        const user = AuthStore.getUser();
        await SMSService.sendEmergency(contactsRes.data || contactsRes, coords, user?.name);
      } catch (_) {
        // SMS failure should not block SOS
      }

      // 5. Start live location tracking
      await LocationService.startWatching(async loc => {
        try {
          await sosAPI.updateLocation(data.sos._id, { lat: loc.lat, lng: loc.lng });
        } catch (_) {}
      });

      return data.sos;
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to trigger SOS. Check your connection.';
      setError(msg);
      await SirenService.stop();
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSOS = useCallback(async () => {
    if (!sos) return;
    setLoading(true);
    try {
      await sosAPI.cancel(sos._id);
      await SirenService.stop();
      await LocationService.stopWatching();
      await SOSStore.clear();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to cancel SOS');
    } finally {
      setLoading(false);
    }
  }, [sos]);

  return { sos, loading, error, triggerSOS, cancelSOS };
}
