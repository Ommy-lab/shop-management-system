import api from './api';
import { createResourceService } from './resourceService';
const base = createResourceService('/sales');
export const saleService = { ...base, listMine: () => api.get('/sales/my-sales') };
export default saleService;
