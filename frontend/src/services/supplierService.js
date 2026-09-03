import api from './api';
export default { list: () => api.get('/suppliers'), get: (id) => api.get(`/suppliers/${id}`), create: (data) => api.post('/suppliers', data), update: (id, data) => api.put(`/suppliers/${id}`, data), remove: (id) => api.delete(`/suppliers/${id}`) };
