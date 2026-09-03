import api from './api';
export default { list: () => api.get('/truck-stock-events/my-events'), get: (id) => api.get(`/truck-stock-events/${id}`), create: (data) => api.post('/truck-stock-events', data) };
