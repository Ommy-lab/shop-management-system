import api from './api';
const get = (path, params) => api.get(`/reports/${path}`, { params });
export default { salesSummary: (p) => get('sales/summary', p), salesByTruck: (p) => get('sales/by-truck', p), salesByProduct: (p) => get('sales/by-product', p), purchases: (p) => get('purchases', p), expenses: (p) => get('expenses', p), debts: (p) => get('debts', p), stockEvents: (p) => get('stock-events', p), bestSelling: (p) => get('best-selling-products', p), profitLoss: (p) => get('profit-loss', p) };
