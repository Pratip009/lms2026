import axios from 'axios';

// Public (no-login) enrollment API. Deliberately NOT the shared `api` instance:
// that one attaches staff JWTs and redirects to /login on 401.
const pub = axios.create({ baseURL: `${process.env.REACT_APP_API_URL || '/api'}/bhi/public` });

const STORAGE_KEY = 'bhi-enrollment';
export const saveSession = (id, token) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, token })); } catch (_) {}
};
export const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { return null; }
};
export const clearSession = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
};

const auth = (token) => ({ headers: { 'X-Application-Token': token } });

export const getEnrollmentConfig = (category) => pub.get('/enrollment-config', { params: { category } });
export const startApplication = (data) => pub.post('/applications', data);
export const getApplication = (id, token) => pub.get(`/applications/${id}`, auth(token));
export const saveApplication = (id, token, data) => pub.patch(`/applications/${id}`, data, auth(token));
export const uploadDocument = (id, token, kind, file) => {
  const form = new FormData();
  form.append('kind', kind);
  form.append('file', file);
  return pub.post(`/applications/${id}/documents`, form, auth(token));
};
export const deleteDocument = (id, token, docId) => pub.delete(`/applications/${id}/documents/${docId}`, auth(token));
export const submitApplication = (id, token, data) => pub.post(`/applications/${id}/submit`, data, auth(token));
export const requestResumeLink = (email) => pub.post('/resume-link', { email });
