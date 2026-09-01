import api from './api';
import { createResourceService } from './resourceService';
const base = createResourceService('/expenses');
export const expenseService = { ...base, todaySummary: () => api.get('/expenses/today/summary'), mine: () => api.get('/expenses/my-expenses') };
export default expenseService;
