import api from './api';
export const reconciliationService = { today: () => api.get('/reconciliations/today'), history: () => api.get('/reconciliations/my-history'), close: (payload) => api.post('/reconciliations/close', payload), admin: (params) => api.get('/reconciliations/admin', { params }), adminGet: (id) => api.get(`/reconciliations/admin/${id}`), approve: (id, payload={}) => api.post(`/reconciliations/admin/${id}/approve`, payload), reject: (id, payload={}) => api.post(`/reconciliations/admin/${id}/reject`, payload) };
export default reconciliationService;
