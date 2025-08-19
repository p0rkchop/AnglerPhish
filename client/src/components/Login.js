// Login component for AnglerPhish defensive security system
// Provides authentication interface for administrators to access the system

import React, { useState, useEffect } from 'react'; // React hooks for state management
import { Navigate } from 'react-router-dom'; // Navigation component for redirects
import {
  Box,        // Flexible container component
  Paper,      // Material design paper surface
  TextField,  // Text input component
  Button,     // Action button component
  Typography, // Text styling component
  Alert,      // Alert/notification component
  Container   // Layout container component
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext'; // Authentication context hook

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography component="h1" variant="h4" gutterBottom>
              🎣 AnglerPhish
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Admin Login
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>
          </Box>
        </Paper>
        
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Development Mode - Check .env file for admin credentials
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Login;