import api from './api';
const report = (path, params) => api.get(path, { params });
export const reportService = { salesSummary: (params) => report('/reports/sales', params), purchaseSummary: (params) => report('/reports/purchases', params), expenseSummary: (params) => report('/reports/expenses', params), debt: (params) => report('/reports/debts', params), profitLoss: (params) => report('/reports/profit-loss', params), bestSellingProducts: (params) => report('/reports/best-selling-products', params), stockEvents: (params) => report('/reports/stock-events', params) };
export default reportService;
