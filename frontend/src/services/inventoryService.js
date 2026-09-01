import api from './api';
export const inventoryService = { store: (params) => api.get('/inventory/store', { params }), summary: () => api.get('/inventory/store/summary'), lowStock: () => api.get('/inventory/store/low-stock'), movements: (params) => api.get('/inventory/movements', { params }), movementsByProduct: (id, params) => api.get(`/inventory/movements/product/${id}`, { params }) };
export default inventoryService;
