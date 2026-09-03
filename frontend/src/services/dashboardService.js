import api from './api';
const paths = { SUPER_ADMIN: 'super-admin', ADMIN: 'admin', STOREKEEPER: 'storekeeper', SALESPERSON: 'salesperson' };
export default { get: (role) => api.get(`/dashboard/${paths[role]}`) };
