import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Launch as LaunchIcon,
  GetApp as GetAppIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { useSubmissions } from '../contexts/SubmissionContext';
import Layout from './Layout';
import submissionService from '../services/submissionService';

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentSubmission,
    loading,
    error,
    fetchSubmission,
    scoreSubmission
  } = useSubmissions();

  const [scoreDialog, setScoreDialog] = useState(false);
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (id) {
      fetchSubmission(id);
    }
    return () => {
      // Clear current submission when leaving
    };
  }, [id]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleScoreSubmit = async () => {
    try {
      await scoreSubmission(id, parseInt(score), notes);
      setScoreDialog(false);
      setScore('');
      setNotes('');
    } catch (error) {
      console.error('Error scoring submission:', error);
    }
  };

  const handleDownloadAttachment = async (filename) => {
    try {
      const blob = await submissionService.downloadAttachment(id, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading || !currentSubmission) {
    return (
      <Layout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography>Loading submission details...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box>
        <Box display="flex" alignItems="center" sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4">
            Email Submission Detail
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Email Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      From
                    </Typography>
                    <Typography variant="body1">
                      {currentSubmission.senderEmail}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Subject
                    </Typography>
                    <Typography variant="body1">
                      {currentSubmission.subject}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Received
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(currentSubmission.receivedAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={currentSubmission.status}
                      color={currentSubmission.status === 'Done' ? 'success' : 'warning'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {currentSubmission.renderedImagePath && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <ImageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Email Preview
                  </Typography>
                  <Box
                    component="img"
                    src={currentSubmission.renderedImagePath}
                    alt="Email preview"
                    sx={{
                      width: '100%',
                      maxWidth: '100%',
                      height: 'auto',
                      border: '1px solid #ddd',
                      borderRadius: 1
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Email Content</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {currentSubmission.emailContent?.html ? (
                  <Box
                    dangerouslySetInnerHTML={{
                      __html: currentSubmission.emailContent.html
                    }}
                    sx={{
                      border: '1px solid #ddd',
                      p: 2,
                      borderRadius: 1,
                      maxHeight: '400px',
                      overflow: 'auto'
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {currentSubmission.emailContent?.text || 'No content available'}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>

            {currentSubmission.extractedUrls && currentSubmission.extractedUrls.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Extracted URLs ({currentSubmission.extractedUrls.length})
                  </Typography>
                  <List>
                    {currentSubmission.extractedUrls.map((url, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemButton
                          component={Link}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ListItemText
                            primary={url}
                            primaryTypographyProps={{
                              style: { wordBreak: 'break-all' }
                            }}
                          />
                          <LaunchIcon fontSize="small" />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {currentSubmission.attachments && currentSubmission.attachments.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Attachments ({currentSubmission.attachments.length})
                  </Typography>
                  <List>
                    {currentSubmission.attachments.map((attachment, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={attachment.originalName}
                          secondary={`${attachment.mimetype} - ${Math.round(attachment.size / 1024)} KB`}
                        />
                        <Button
                          startIcon={<GetAppIcon />}
                          onClick={() => handleDownloadAttachment(attachment.filename)}
                        >
                          Download
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Scoring
                </Typography>
                {currentSubmission.status === 'Done' ? (
                  <Box>
                    <Typography variant="h4" color="primary" gutterBottom>
                      {currentSubmission.score}/100
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Scored by: {currentSubmission.scoredBy?.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Scored on: {formatDate(currentSubmission.scoredAt)}
                    </Typography>
                    {currentSubmission.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Notes:
                        </Typography>
                        <Typography variant="body2">
                          {currentSubmission.notes}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      This submission has not been scored yet.
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => setScoreDialog(true)}
                      sx={{ mt: 2 }}
                    >
                      Score Submission
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Submission Details
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Submission ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                  {currentSubmission.submissionId}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Message ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {currentSubmission.messageId}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog open={scoreDialog} onClose={() => setScoreDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Score Submission</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Score (0-100)"
              type="number"
              fullWidth
              variant="outlined"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              inputProps={{ min: 0, max: 100 }}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Notes (optional)"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScoreDialog(false)}>Cancel</Button>
            <Button
              onClick={handleScoreSubmit}
              variant="contained"
              disabled={!score || score < 0 || score > 100}
            >
              Submit Score
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default SubmissionDetail;