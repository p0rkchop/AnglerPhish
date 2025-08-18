import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { SubmissionProvider } from './contexts/SubmissionContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SubmissionDetail from './components/SubmissionDetail';
import Config from './components/Config';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SubmissionProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/submission/:id" element={
                  <ProtectedRoute>
                    <SubmissionDetail />
                  </ProtectedRoute>
                } />
                <Route path="/config" element={
                  <ProtectedRoute>
                    <Config />
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </SubmissionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
