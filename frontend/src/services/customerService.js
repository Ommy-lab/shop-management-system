import api from './api';
import { createResourceService } from './resourceService';
const base = createResourceService('/customers');
export const customerService = { ...base, listMine: () => api.get('/customers/my-customers') };
export default customerService;
