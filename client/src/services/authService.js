// Authentication service for AnglerPhish defensive security system
// Handles API calls for user authentication and token management

import axios from 'axios'; // HTTP client for API requests

// API base URL - uses environment variable or defaults to relative path
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Authentication service object with methods for user management
const authService = {
  // Authenticate user with email and password, return JWT token and user info
  login: async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    return response.data; // Contains { token, user } on success
  },

  // Get current authenticated user information using stored token
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}` // Include JWT token for authentication
      }
    });
    return response.data.user; // Returns user object with id, email, role
  },

  // Create initial administrator user (for system setup)
  createAdmin: async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/create-admin`, {
      email,
      password
    });
    return response.data; // Returns success message
  }
};

// Export authentication service for use by React components and contexts
export default authService;