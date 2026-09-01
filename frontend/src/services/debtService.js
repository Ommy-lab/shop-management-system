import api from './api';
export const debtService = { summary: () => api.get('/debts/summary'), outstandingSales: () => api.get('/debts/outstanding-sales'), customers: () => api.get('/debts/customers'), customer: (id) => api.get(`/debts/customers/${id}`) };
export default debtService;
