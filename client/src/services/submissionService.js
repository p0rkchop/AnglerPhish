import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
};

const submissionService = {
  getSubmissions: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/submissions`, {
      headers: getAuthHeaders(),
      params
    });
    return response.data;
  },

  getSubmission: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/submissions/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  scoreSubmission: async (id, score, notes) => {
    const response = await axios.post(`${API_BASE_URL}/submissions/${id}/score`, {
      score,
      notes
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/submissions/stats/summary`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  downloadAttachment: async (submissionId, filename) => {
    const response = await axios.get(
      `${API_BASE_URL}/submissions/${submissionId}/attachments/${filename}`,
      {
        headers: getAuthHeaders(),
        responseType: 'blob'
      }
    );
    return response.data;
  }
};

export default submissionService;