import { useState, useEffect } from 'react';
import { LocationService } from '../services/LocationService';

export function useLocation(watch = false) {
  const [location, setLocation] = useState(null);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const ok = await LocationService.requestPermission();
      if (!ok) {
        if (mounted) { setError('Location permission denied'); setLoading(false); }
        return;
      }
      try {
        const pos = await LocationService.getCurrentPosition();
        if (mounted) { setLocation(pos); setLoading(false); }
      } catch (e) {
        if (mounted) { setError(e.message); setLoading(false); }
      }

      if (watch && mounted) {
        await LocationService.startWatching(
          pos => { if (mounted) setLocation(pos); },
          err => { if (mounted) setError(err.message); },
        );
      }
    })();

    return () => {
      mounted = false;
      if (watch) LocationService.stopWatching();
    };
  }, [watch]);

  return { location, error, loading };
}
