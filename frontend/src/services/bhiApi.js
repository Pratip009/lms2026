import api from './api';

// ─── Programs ────────────────────────────────────────────
export const getPrograms = (type) => api.get('/bhi/programs', { params: { type } });
export const createProgram = (data) => api.post('/bhi/programs', data);
export const updateProgram = (id, data) => api.patch(`/bhi/programs/${id}`, data);
export const deactivateProgram = (id) => api.delete(`/bhi/programs/${id}`);

// ─── Classes ─────────────────────────────────────────────
export const getTeachers = () => api.get('/bhi/teachers');
export const listTeacherAccounts = () => api.get('/bhi/teacher-accounts');
export const createTeacherAccount = (data) => api.post('/bhi/teacher-accounts', data);
export const setTeacherActive = (id, isActive) => api.patch(`/bhi/teacher-accounts/${id}/deactivate`, { isActive });
export const getClasses = (params) => api.get('/bhi/classes', { params });
export const getClassById = (id) => api.get(`/bhi/classes/${id}`);
export const createClass = (data) => api.post('/bhi/classes', data);
export const updateClass = (id, data) => api.patch(`/bhi/classes/${id}`, data);
export const deactivateClass = (id) => api.delete(`/bhi/classes/${id}`);

// ─── Students ────────────────────────────────────────────
export const getStudents = (params) => api.get('/bhi/students', { params });
export const searchStudents = (q) => api.get('/bhi/students/search', { params: { q } });
export const getStudent = (id) => api.get(`/bhi/students/${id}`);
export const createStudent = (data) => api.post('/bhi/students', data);
export const updateStudent = (id, data) => api.patch(`/bhi/students/${id}`, data);
export const changeStudentStatus = (id, data) => api.patch(`/bhi/students/${id}/status`, data);
export const transferStudent = (id, data) => api.post(`/bhi/students/${id}/transfer`, data);

// ─── Calendar ────────────────────────────────────────────
export const getCalendarEvents = (start, end) => api.get('/bhi/calendar', { params: { start, end } });
export const addCalendarEvent = (data) => api.post('/bhi/calendar', data);
export const removeCalendarEvent = (id) => api.delete(`/bhi/calendar/${id}`);

// ─── Attendance ──────────────────────────────────────────
export const getRoster = (classId, date) => api.get('/bhi/attendance/roster', { params: { classId, date } });
export const submitAttendance = (data) => api.post('/bhi/attendance/submit', data);
export const correctAttendance = (recordId, data) => api.patch(`/bhi/attendance/${recordId}/correct`, data);
export const getAuditHistory = (recordId) => api.get(`/bhi/attendance/${recordId}/audit-history`);
export const getOverviewLists = () => api.get('/bhi/attendance/overview');
export const getDashboard = (params) => api.get('/bhi/attendance/dashboard', { params });
export const getClassBreakdown = () => api.get('/bhi/attendance/class-breakdown');
export const getAlerts = () => api.get('/bhi/attendance/alerts');
export const overrideStudentColor = (studentId, data) =>
  api.patch(`/bhi/attendance/students/${studentId}/override`, data);
export const getStudentProfile = (studentId) => api.get(`/bhi/attendance/students/${studentId}/profile`);
export const getColorConfig = () => api.get('/bhi/attendance/color-config');
export const updateColorConfig = (data) => api.patch('/bhi/attendance/color-config', data);
export const getLessonHistory = (classId) => api.get('/bhi/attendance/lesson-history', { params: { classId } });
export const getLessonDayDetail = (dailyRecordId) =>
  api.get(`/bhi/attendance/lesson-history/${dailyRecordId}`);

// ─── Reports ─────────────────────────────────────────────
export const getReport = (params) => api.get('/bhi/reports', { params });

// Downloads a report file (auth header is required, so we fetch as a blob
// rather than linking directly to the URL).
export const downloadReport = async (params) => {
  const res = await api.get('/bhi/reports/export', { params, responseType: 'blob' });
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `bhi-report.${params.format}`;

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
