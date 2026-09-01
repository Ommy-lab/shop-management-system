import api from './api';
export const paymentService = { createForSale: (saleId, payload) => api.post(`/payments/sales/${saleId}`, payload), listForSale: (saleId) => api.get(`/payments/sales/${saleId}`) };
export default paymentService;
