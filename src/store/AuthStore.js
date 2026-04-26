import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: 'sos_user',
  TOKEN: 'sos_token',
};

let _user = null;
let _token = null;
let _isReady = false;

const _listeners = new Set();

// ─────────────────────────────────────────────
// AUTH STORE
// ─────────────────────────────────────────────
export const AuthStore = {

  // ✅ FIX 1: init flag added (VERY IMPORTANT)
  async init() {
    try {
      const [user, token] = await Promise.all([
        AsyncStorage.getItem(KEYS.USER),
        AsyncStorage.getItem(KEYS.TOKEN),
      ]);

      _user = user ? JSON.parse(user) : null;
      _token = token || null;

    } catch (error) {
      console.log("Auth init error:", error);
      _user = null;
      _token = null;
    }

    _isReady = true;
    _notify();
  },

  // ── READY STATE ─────────────────────────────
  isReady() {
    return _isReady;
  },

  // ── GETTERS ────────────────────────────────
  getUser() {
    return _user;
  },

  getToken() {
    return _token;
  },

  isLoggedIn() {
    return !!_token;
  },

  isAdmin() {
    return _user?.role === 'admin';
  },

  isVolunteer() {
    return _user?.role === 'volunteer';
  },

  // ── SET AUTH ───────────────────────────────
  async setAuth(user, token) {
    if (!user || !token) {
      console.warn("Invalid auth data", user, token);
      return;
    }

    _user = user;
    _token = token;

    try {
      await Promise.all([
        AsyncStorage.setItem(KEYS.USER, JSON.stringify(user)),
        AsyncStorage.setItem(KEYS.TOKEN, token),
      ]);
    } catch (error) {
      console.log("Auth save error:", error);
    }

    _notify();
  },

  // ── UPDATE USER ────────────────────────────
  async updateUser(updates) {
    _user = { ..._user, ...updates };

    try {
      await AsyncStorage.setItem(
        KEYS.USER,
        JSON.stringify(_user)
      );
    } catch (error) {
      console.log("Update user error:", error);
    }

    _notify();
  },

  // ── LOGOUT ────────────────────────────────
  async logout() {
    _user = null;
    _token = null;

    try {
      await Promise.all([
        AsyncStorage.removeItem(KEYS.USER),
        AsyncStorage.removeItem(KEYS.TOKEN),
      ]);
    } catch (error) {
      console.log("Logout error:", error);
    }

    _notify();
  },

  // ── SUBSCRIBE ─────────────────────────────
  subscribe(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};

// ─────────────────────────────────────────────
// INTERNAL NOTIFY
// ─────────────────────────────────────────────
function _notify() {
  _listeners.forEach(fn =>
    fn({
      user: _user,
      token: _token,
      isReady: _isReady,
    })
  );
}