import { Accelerometer } from 'expo-sensors';

const CRASH_THRESHOLD = 2.5; // in g-force (expo-sensors returns in g)
const DEBOUNCE_MS     = 3000;

let _subscription  = null;
let _callback      = null;
let _lastTrigger   = 0;
let _prev          = { x: 0, y: 0, z: 0 };

export const CrashDetectionService = {
  start(onCrashDetected) {
    _callback = onCrashDetected;
    _prev     = { x: 0, y: 0, z: 0 };

    Accelerometer.setUpdateInterval(100);
    _subscription = Accelerometer.addListener(({ x, y, z }) => {
      const delta = Math.sqrt(
        (x - _prev.x) ** 2 +
        (y - _prev.y) ** 2 +
        (z - _prev.z) ** 2,
      );
      _prev = { x, y, z };

      if (delta > CRASH_THRESHOLD) {
        const now = Date.now();
        if (now - _lastTrigger > DEBOUNCE_MS) {
          _lastTrigger = now;
          _callback?.();
        }
      }
    });
  },

  stop() {
    _subscription?.remove();
    _subscription = null;
    _callback     = null;
  },

  // For testing
  _simulateCrash() {
    _callback?.();
  },
};
