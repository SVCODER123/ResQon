// ─── App Constants ───────────────────────────────────────────────────────────

export const COLORS = {
  primary:     '#E53935',
  primaryDark: '#B71C1C',
  secondary:   '#1565C0',
  success:     '#2E7D32',
  warning:     '#F57F17',
  bg:          '#0D0D0D',
  surface:     '#1A1A1A',
  card:        '#242424',
  border:      '#333333',
  text:        '#FFFFFF',
  textSub:     '#9E9E9E',
  textMuted:   '#616161',
  danger:      '#FF1744',
  volunteer:   '#00BFA5',
};

// ─────────────────────────────────────────────
// API CONFIG (FIXED)
// ─────────────────────────────────────────────

// 🔥 CHANGE THIS BASE ONLY
const BASE_URL = 'http://192.168.1.108:5000';

// API PREFIX  
export const API_BASE = `${BASE_URL}/api`;

// ─────────────────────────────────────────────
// APP CONFIG
// ─────────────────────────────────────────────

export const POLL_INTERVAL = 5000;
export const NEARBY_RADIUS_KM = 5;

// ─────────────────────────────────────────────
// SOS STATUS
// ─────────────────────────────────────────────
export const SOS_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  RESPONDING: 'responding',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
};

// ─────────────────────────────────────────────
// USER ROLES (FIXED - MATCH AUTHSTORE)
// ─────────────────────────────────────────────
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  VOLUNTEER: 'volunteer',
};

// ─────────────────────────────────────────────
// INCIDENT TYPES
// ─────────────────────────────────────────────
export const INCIDENT_TYPES = [
  'Medical Emergency',
  'Accident / Crash',
  'Fire',
  'Crime / Threat',
  'Natural Disaster',
  'Other',
];