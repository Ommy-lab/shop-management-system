import axios from 'axios';

const TOKEN_KEY = 'shop_auth_token';

const api = axios.create({
    // Keep the backend URL outside React components so it can be changed per environment.
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    });

    // Attach the current JWT to every authenticated API request.
    api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY);

        if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// A 401 means the stored session is no longer accepted by the backend.
// The AuthContext is responsible for updating React state and redirecting.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new Event('shop-auth-expired'));
        }

        return Promise.reject(error);
    }
);

export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    me: () => api.get('/auth/me'),
};

export const dashboardApi = {
  // Pass the exact backend dashboard endpoint when its route is connected.
  // Keeping this adapter here prevents API URLs from being scattered through pages.
    get: (endpoint) => api.get(endpoint),
};

export { TOKEN_KEY };
export default api;
