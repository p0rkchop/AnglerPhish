import React, { createContext, useContext, useReducer } from 'react';
import submissionService from '../services/submissionService';

const SubmissionContext = createContext();

const initialState = {
  submissions: [],
  currentSubmission: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  },
  stats: {
    total: 0,
    pending: 0,
    completed: 0,
    averageScore: 0
  }
};

const submissionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'FETCH_SUBMISSIONS_SUCCESS':
      return {
        ...state,
        submissions: action.payload.submissions,
        pagination: action.payload.pagination,
        loading: false,
        error: null
      };
    case 'FETCH_SUBMISSION_SUCCESS':
      return {
        ...state,
        currentSubmission: action.payload,
        loading: false,
        error: null
      };
    case 'SCORE_SUBMISSION_SUCCESS':
      return {
        ...state,
        currentSubmission: action.payload,
        submissions: state.submissions.map(sub =>
          sub._id === action.payload._id ? action.payload : sub
        ),
        loading: false,
        error: null
      };
    case 'FETCH_STATS_SUCCESS':
      return {
        ...state,
        stats: action.payload,
        loading: false,
        error: null
      };
    case 'CLEAR_CURRENT_SUBMISSION':
      return {
        ...state,
        currentSubmission: null
      };
    default:
      return state;
  }
};

export const SubmissionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(submissionReducer, initialState);

  const fetchSubmissions = async (params = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await submissionService.getSubmissions(params);
      dispatch({
        type: 'FETCH_SUBMISSIONS_SUCCESS',
        payload: response
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.error || 'Failed to fetch submissions'
      });
    }
  };

  const fetchSubmission = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const submission = await submissionService.getSubmission(id);
      dispatch({
        type: 'FETCH_SUBMISSION_SUCCESS',
        payload: submission
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.error || 'Failed to fetch submission'
      });
    }
  };

  const scoreSubmission = async (id, score, notes) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const submission = await submissionService.scoreSubmission(id, score, notes);
      dispatch({
        type: 'SCORE_SUBMISSION_SUCCESS',
        payload: submission
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.error || 'Failed to score submission'
      });
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await submissionService.getStats();
      dispatch({
        type: 'FETCH_STATS_SUCCESS',
        payload: stats
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.error || 'Failed to fetch stats'
      });
    }
  };

  const clearCurrentSubmission = () => {
    dispatch({ type: 'CLEAR_CURRENT_SUBMISSION' });
  };

  const value = {
    ...state,
    fetchSubmissions,
    fetchSubmission,
    scoreSubmission,
    fetchStats,
    clearCurrentSubmission
  };

  return (
    <SubmissionContext.Provider value={value}>
      {children}
    </SubmissionContext.Provider>
  );
};

export const useSubmissions = () => {
  const context = useContext(SubmissionContext);
  if (!context) {
    throw new Error('useSubmissions must be used within SubmissionProvider');
  }
  return context;
};