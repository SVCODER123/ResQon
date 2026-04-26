import * as Location from 'expo-location';

let _watcher = null;

export const LocationService = {
  async requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentPosition() {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      lat:      loc.coords.latitude,
      lng:      loc.coords.longitude,
      accuracy: loc.coords.accuracy,
    };
  },

  async startWatching(onLocation, onError) {
    if (_watcher) await this.stopWatching();
    try {
      _watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
        loc => onLocation({
          lat:      loc.coords.latitude,
          lng:      loc.coords.longitude,
          accuracy: loc.coords.accuracy,
        }),
      );
    } catch (e) {
      onError?.(e);
    }
  },

  async stopWatching() {
    if (_watcher) {
      _watcher.remove();
      _watcher = null;
    }
  },

  distanceBetween(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = _toRad(lat2 - lat1);
    const dLng = _toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(_toRad(lat1)) * Math.cos(_toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
};

function _toRad(deg) { return (deg * Math.PI) / 180; }
