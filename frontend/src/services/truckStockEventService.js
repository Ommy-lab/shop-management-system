import api from './api';
import { createResourceService } from './resourceService';
const base = createResourceService('/truck-stock-events');
export const truckStockEventService = { ...base, listMine: () => api.get('/truck-stock-events/my-events') };
export default truckStockEventService;
