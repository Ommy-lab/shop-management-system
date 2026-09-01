import api from './api';
export const dashboardService = { getSuperAdminDashboard: () => api.get('/dashboard/super-admin'), getAdminDashboard: () => api.get('/dashboard/admin'), getStorekeeperDashboard: () => api.get('/dashboard/storekeeper'), getSalespersonDashboard: () => api.get('/dashboard/salesperson') };
export default dashboardService;
