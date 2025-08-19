// Main React application component for AnglerPhish defensive security system
// Provides routing, theming, and context providers for the admin interface

import React from 'react'; // React library for UI components
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Client-side routing
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Material-UI theming
import CssBaseline from '@mui/material/CssBaseline'; // CSS reset and baseline styles
import { AuthProvider } from './contexts/AuthContext'; // Authentication state management
import { SubmissionProvider } from './contexts/SubmissionContext'; // Submission data management
import Login from './components/Login'; // Login page component
import Dashboard from './components/Dashboard'; // Main dashboard for reviewing submissions
import SubmissionDetail from './components/SubmissionDetail'; // Detailed submission view
import Config from './components/Config'; // System configuration page
import ProtectedRoute from './components/ProtectedRoute'; // Route wrapper for authenticated access
import ErrorBoundary from './components/ErrorBoundary'; // Error handling wrapper

// Material-UI theme configuration for consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Primary blue color for buttons, headers
    },
    secondary: {
      main: '#dc004e', // Secondary red color for alerts, dangerous actions
    },
  },
});

// Main App component - sets up the application shell with providers and routing
function App() {
  return (
    // Error boundary catches and displays any unhandled React errors
    <ErrorBoundary>
      {/* Apply Material-UI theme to all child components */}
      <ThemeProvider theme={theme}>
        {/* CSS baseline for consistent styling across browsers */}
        <CssBaseline />
        {/* Authentication context for managing user login state */}
        <AuthProvider>
          {/* Submission context for managing phishing email data */}
          <SubmissionProvider>
            {/* Client-side routing for single-page application */}
            <Router>
              <Routes>
                {/* Public login route - no authentication required */}
                <Route path="/login" element={<Login />} />
                {/* Protected root route - redirects to dashboard */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                {/* Dashboard route - main submission review interface */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                {/* Individual submission detail view with scoring interface */}
                <Route path="/submission/:id" element={
                  <ProtectedRoute>
                    <SubmissionDetail />
                  </ProtectedRoute>
                } />
                {/* System configuration page for admin settings */}
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

// Export App component as default export for use in index.js
export default App;
