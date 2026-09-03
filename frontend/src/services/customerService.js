import api from './api';
export default { list: () => api.get('/customers/my-customers'), create: (data) => api.post('/customers', data) };
