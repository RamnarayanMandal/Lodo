import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/api/auth/register', { username, email, password });
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
};

export const roomsAPI = {
  create: async () => {
    const response = await api.post('/api/rooms/create');
    return response.data;
  },
  join: async (code: string) => {
    const response = await api.post('/api/rooms/join', { code });
    return response.data;
  },
  get: async (code: string) => {
    const response = await api.get(`/api/rooms/${code}`);
    return response.data;
  },
};

export default api;
