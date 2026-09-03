import api from './api';
export default { list: () => api.get('/purchases'), get: (id) => api.get(`/purchases/${id}`), create: (data) => api.post('/purchases', data) };
