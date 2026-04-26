// Simple in-memory + AsyncStorage SOS state store
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOS_STATUS } from '../constants';

const KEY = 'sos_active';
let _sos = null; // { id, status, location, startedAt }
const _listeners = new Set();

export const SOSStore = {
  async init() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      _sos = raw ? JSON.parse(raw) : null;
    } catch (_) { _sos = null; }
    _notify();
  },

  getActive() { return _sos; },
  isActive()  { return !!_sos && _sos.status !== SOS_STATUS.RESOLVED && _sos.status !== SOS_STATUS.CANCELLED; },

  async setActive(sos) {
    _sos = sos;
    await AsyncStorage.setItem(KEY, JSON.stringify(sos));
    _notify();
  },

  async updateStatus(status) {
    if (!_sos) return;
    _sos = { ..._sos, status };
    await AsyncStorage.setItem(KEY, JSON.stringify(_sos));
    _notify();
  },

  async clear() {
    _sos = null;
    await AsyncStorage.removeItem(KEY);
    _notify();
  },

  subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn); },
};

function _notify() {
  _listeners.forEach(fn => fn(_sos));
}
