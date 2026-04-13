// ============================================
// api.js - Axios Instance with Interceptors
// ============================================

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});


// ── Request Interceptor ────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ── Response Interceptor ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);


// ── AUTH API ────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};


// ── CHAT API ────────────────────────────────────────────
export const chatAPI = {
  getAll: () => api.get('/chats'),
  getById: (id) => api.get(`/chats/${id}`),
  create: (data = {}) => api.post('/chats', data),
  delete: (id) => api.delete(`/chats/${id}`),
  getStats: () => api.get('/chats/stats'),

  // ── TEXT QUESTION ─────────────────────────────────────
  askText: (chatId, question, subject) => {
    return api.post(`/chats/${chatId}/text`, {
      question,
      subject,
    });
  },

  // ── IMAGE QUESTION ────────────────────────────────────
  askImage: (chatId, imageFile, question, subject) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    if (question) formData.append('question', question);
    if (subject) formData.append('subject', subject);

    return api.post(`/chats/${chatId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 90000,
    });
  },

  // ── VOICE QUESTION ────────────────────────────────────
  askVoice: (chatId, audioBlob, subject) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_recording.webm');

    if (subject) formData.append('subject', subject);

    return api.post(`/chats/${chatId}/voice`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 90000,
    });
  },
};

export default api;