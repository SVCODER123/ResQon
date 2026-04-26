import axios from 'axios';
import { API_BASE } from '../constants';
import { AuthStore } from '../store/AuthStore';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// ─────────────────────────────────────────────
// FIX 1: Safer token handling (async-safe ready)
// ─────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = AuthStore.getToken?.(); // safe optional call

      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (err) {
      // Don’t break requests if auth fails
      console.warn('Auth interceptor error:', err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// FIX 2: Central response error handling (optional but useful)
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can extend this later (logout on 401, etc.)
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ─────────────────────────────────────────────
// SOS
// ─────────────────────────────────────────────
export const sosAPI = {
  trigger: (data) => api.post('/sos/trigger', data),
  cancel: (id) => api.post(`/sos/${id}/cancel`),
  resolve: (id) => api.post(`/sos/${id}/resolve`),
  updateLocation: (id, coords) =>
    api.put(`/sos/${id}/location`, coords),

  getActive: () => api.get('/sos/active'),
  getById: (id) => api.get(`/sos/${id}`),
  verify: (id, data) => api.post(`/sos/${id}/verify`, data),
};

// ─────────────────────────────────────────────
// VOLUNTEERS
// ─────────────────────────────────────────────
export const volunteerAPI = {
  getNearby: (lat, lng, radius) =>
    api.get('/volunteers/nearby', {
      params: { lat, lng, radius },
    }),

  acceptIncident: (sosId) =>
    api.post(`/volunteers/accept/${sosId}`),

  updateLocation: (lat, lng) =>
    api.put('/volunteers/location', { lat, lng }),

  getResponders: (sosId) =>
    api.get(`/volunteers/responders/${sosId}`),
};

// ─────────────────────────────────────────────
// EVIDENCE
// ─────────────────────────────────────────────
export const evidenceAPI = {
  upload: (sosId, formData) =>
    api.post(`/evidence/${sosId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getAll: (sosId) => api.get(`/evidence/${sosId}`),
};

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────
export const adminAPI = {
  getIncidents: (params) =>
    api.get('/admin/incidents', { params }),

  getIncident: (id) =>
    api.get(`/admin/incidents/${id}`),

  routeEmergency: (id, data) =>
    api.post(`/admin/incidents/${id}/route`, data),

  verifyEvidence: (evidId) =>
    api.post(`/admin/evidence/${evidId}/verify`),

  closeIncident: (id) =>
    api.post(`/admin/incidents/${id}/close`),

  getDashboard: () =>
    api.get('/admin/dashboard'),
};

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),

  getContacts: () => api.get('/users/contacts'),

  addContact: (data) => api.post('/users/contacts', data),

  removeContact: (id) =>
    api.delete(`/users/contacts/${id}`),
};

export default api;