import api from './api';
import { createResourceService } from './resourceService';
const base = createResourceService('/truck-loads');
export const truckLoadService = { ...base, inventory: (truckId) => api.get(`/truck-loads/truck/${truckId}/inventory`) };
export default truckLoadService;
