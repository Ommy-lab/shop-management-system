import api from './api';
export default { list: () => api.get('/sales/my-sales'), get: (id) => api.get(`/sales/${id}`), create: (data) => api.post('/sales', data) };
