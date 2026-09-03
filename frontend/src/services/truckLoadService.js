import api from './api';
export default { list: () => api.get('/truck-loads'), get: (id) => api.get(`/truck-loads/${id}`), create: (data) => api.post('/truck-loads', data), inventory: (truckId) => api.get(`/truck-loads/truck/${truckId}/inventory`) };
