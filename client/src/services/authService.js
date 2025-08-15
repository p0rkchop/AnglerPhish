import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const authService = {
  login: async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.user;
  },

  createAdmin: async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/create-admin`, {
      email,
      password
    });
    return response.data;
  }
};

export default authService;