import { useState, useEffect, useRef, useCallback } from 'react';
import { POLL_INTERVAL } from '../constants';

/**
 * Polls `fetchFn` every `interval` ms and returns { data, loading, error, refresh }.
 */
export function usePolling(fetchFn, interval = POLL_INTERVAL, enabled = true) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const timerRef = useRef(null);
  const mountRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (mountRef.current) {
        setData(result?.data ?? result);
        setError(null);
      }
    } catch (e) {
      if (mountRef.current) setError(e?.response?.data?.message || 'Network error');
    } finally {
      if (mountRef.current) setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    mountRef.current = true;
    if (!enabled) return;

    fetch(); // immediate first call
    timerRef.current = setInterval(fetch, interval);

    return () => {
      mountRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [fetch, interval, enabled]);

  return { data, loading, error, refresh: fetch };
}
