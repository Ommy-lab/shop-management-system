import api from './api';
export default { list: () => api.get('/users'), get: (id) => api.get(`/users/${id}`), create: (data) => api.post('/users', data), update: (id, data) => api.put(`/users/${id}`, data), resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data), assignTruck: (id, data) => api.put(`/users/${id}/assign-truck`, data) };
