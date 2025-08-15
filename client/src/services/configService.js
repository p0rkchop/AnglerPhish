import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
};

const configService = {
  getConfig: async () => {
    const response = await axios.get(`${API_BASE_URL}/config`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateConfig: async (key, value, description, category) => {
    const response = await axios.put(`${API_BASE_URL}/config/${key}`, {
      value,
      description,
      category
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  testEmailConnection: async () => {
    const response = await axios.post(`${API_BASE_URL}/config/test-email`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  checkEmails: async () => {
    const response = await axios.post(`${API_BASE_URL}/config/check-emails`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getHealth: async () => {
    const response = await axios.get(`${API_BASE_URL}/config/health`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

export default configService;