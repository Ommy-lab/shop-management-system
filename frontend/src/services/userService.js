import api from './api';
import { createResourceService } from './resourceService';
const base = createResourceService('/users');
export const userService = { ...base, resetPassword: (id, payload) => api.patch(`/users/${id}/reset-password`, payload), assignTruck: (id, payload) => api.patch(`/users/${id}/assign-truck`, payload) };
export default userService;
