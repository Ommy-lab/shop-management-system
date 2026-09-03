import api from './api';
export default { list: () => api.get('/trucks'), get: (id) => api.get(`/trucks/${id}`), create: (data) => api.post('/trucks', data), update: (id, data) => api.put(`/trucks/${id}`, data), remove: (id) => api.delete(`/trucks/${id}`) };
