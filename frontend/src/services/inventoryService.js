import api from './api';
export default { store: () => api.get('/inventory/store'), summary: () => api.get('/inventory/store/summary'), lowStock: () => api.get('/inventory/store/low-stock'), movements: () => api.get('/inventory/movements'), productMovements: (id) => api.get(`/inventory/movements/product/${id}`) };
