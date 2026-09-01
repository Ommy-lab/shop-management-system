import api from './api';

// Shared CRUD adapter keeps endpoint handling consistent across modules.
export function createResourceService(basePath) {
  return {
    list: (params) => api.get(basePath, { params }),
    get: (id) => api.get(`${basePath}/${id}`),
    create: (payload) => api.post(basePath, payload),
    update: (id, payload) => api.put(`${basePath}/${id}`, payload),
    remove: (id) => api.delete(`${basePath}/${id}`),
  };
}
