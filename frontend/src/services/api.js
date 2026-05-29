import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export const analyzeSong = async (title, artist) => {
  const response = await api.post('/analyze', { title, artist });
  return response.data;
};

export const getHistory = async (page = 1, limit = 20) => {
  const response = await api.get('/history', { params: { page, limit } });
  return response.data;
};

export const getTrending = async () => {
  const response = await api.get('/trending');
  return response.data;
};

export default api;
