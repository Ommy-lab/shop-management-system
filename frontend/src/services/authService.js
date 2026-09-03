import api from './api';
export default { login: (credentials) => api.post('/auth/login', credentials), me: () => api.get('/auth/me') };
