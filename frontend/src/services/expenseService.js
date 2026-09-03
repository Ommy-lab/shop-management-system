import api from './api';
export default { summary: () => api.get('/expenses/today/summary'), list: () => api.get('/expenses/my-expenses'), get: (id) => api.get(`/expenses/${id}`), create: (data) => api.post('/expenses', data) };
