import axios from 'axios';

const API = axios.create({
  baseURL: 'https://task-manager-backend-production-13c7.up.railway.app/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const getAllUsers = () => API.get('/auth/users');

// Projects
export const getProjects = () => API.get('/projects');
export const getProject = (id) => API.get(`/projects/${id}`);
export const createProject = (data) => API.post('/projects', data);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
export const addMember = (projectId, userId) => API.post(`/projects/${projectId}/members`, { userId });
export const removeMember = (projectId, userId) => API.delete(`/projects/${projectId}/members/${userId}`);

// Tasks
export const getProjectTasks = (projectId, params) => API.get(`/projects/${projectId}/tasks`, { params });
export const createTask = (projectId, data) => API.post(`/projects/${projectId}/tasks`, data);
export const updateTask = (projectId, taskId, data) => API.put(`/projects/${projectId}/tasks/${taskId}`, data);
export const deleteTask = (projectId, taskId) => API.delete(`/projects/${projectId}/tasks/${taskId}`);

// Dashboard
export const getDashboard = () => API.get('/dashboard');
