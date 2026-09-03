import api from './api';
export default { list: () => api.get('/products'), get: (id) => api.get(`/products/${id}`), create: (data) => api.post('/products', data), update: (id, data) => api.put(`/products/${id}`, data), remove: (id) => api.delete(`/products/${id}`) };
