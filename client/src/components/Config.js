import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Snackbar,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  MonitorHeart as HealthIcon
} from '@mui/icons-material';
import Layout from './Layout';
import configService from '../services/configService';

const Config = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const healthData = await configService.getHealth();
      setHealth(healthData);
    } catch (error) {
      setError('Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    setEmailTesting(true);
    try {
      await configService.testEmailConnection();
      setSuccess('Email connection test successful!');
      checkHealth(); // Refresh health status
    } catch (error) {
      setError('Email connection test failed: ' + error.response?.data?.details);
    } finally {
      setEmailTesting(false);
    }
  };

  const checkEmails = async () => {
    setEmailChecking(true);
    try {
      const result = await configService.checkEmails();
      setSuccess(`${result.message} Found ${result.submissions} new emails.`);
    } catch (error) {
      setError('Email check failed: ' + error.response?.data?.details);
    } finally {
      setEmailChecking(false);
    }
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getHealthStatus = (status) => {
    return status === 'connected' ? 'success' : 'error';
  };

  const getHealthIcon = (status) => {
    return status === 'connected' ? <CheckCircleIcon /> : <ErrorIcon />;
  };

  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          System Configuration
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                  <HealthIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">System Health</Typography>
                  <Button
                    size="small"
                    startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    onClick={checkHealth}
                    disabled={loading}
                    sx={{ ml: 'auto' }}
                  >
                    Refresh
                  </Button>
                </Box>

                {health && (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Database
                        </Typography>
                        <Box display="flex" alignItems="center">
                          {getHealthIcon(health.database)}
                          <Chip
                            label={health.database}
                            color={getHealthStatus(health.database)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Email Service
                        </Typography>
                        <Box display="flex" alignItems="center">
                          {getHealthIcon(health.email)}
                          <Chip
                            label={health.email}
                            color={getHealthStatus(health.email)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        {health.emailError && (
                          <Typography variant="caption" color="error">
                            {health.emailError}
                          </Typography>
                        )}
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Uptime
                        </Typography>
                        <Typography variant="body1">
                          {formatUptime(health.uptime)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Memory Usage
                        </Typography>
                        <Typography variant="body1">
                          {formatMemory(health.memory.rss)}
                        </Typography>
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Environment
                        </Typography>
                        <Chip
                          label={health.environment}
                          color={health.environment === 'production' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                  <EmailIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Email Management</Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Test email connection and manually check for new emails.
                </Typography>

                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={testEmailConnection}
                    disabled={emailTesting}
                    startIcon={emailTesting ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                  >
                    {emailTesting ? 'Testing Connection...' : 'Test Email Connection'}
                  </Button>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={checkEmails}
                    disabled={emailChecking}
                    startIcon={emailChecking ? <CircularProgress size={16} /> : <RefreshIcon />}
                  >
                    {emailChecking ? 'Checking Emails...' : 'Check for New Emails'}
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  <strong>Note:</strong> The system automatically checks for new emails every 5 minutes.
                  Use the manual check button to force an immediate check.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Email Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Current email configuration is managed through environment variables.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      IMAP Server
                    </Typography>
                    <Typography variant="body1">
                      {process.env.REACT_APP_IMAP_HOST || 'imap.gmail.com:993'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      SMTP Server
                    </Typography>
                    <Typography variant="body1">
                      {process.env.REACT_APP_SMTP_HOST || 'smtp.gmail.com:587'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Submission Email
                    </Typography>
                    <Typography variant="body1">
                      anglerphish25@gmail.com
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
        >
          <Alert onClose={() => setSuccess('')} severity="success">
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default Config;