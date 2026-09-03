import api from './api';
export default { forSale: (id) => api.get(`/payments/sales/${id}`), create: (id, data) => api.post(`/payments/sales/${id}`, data) };
