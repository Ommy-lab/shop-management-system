import api from './api';
export default { summary: () => api.get('/debts/summary'), outstanding: () => api.get('/debts/outstanding-sales'), customers: () => api.get('/debts/customers'), customer: (id) => api.get(`/debts/customers/${id}`) };
