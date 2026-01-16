import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h3">Welcome to the POS Dashboard!</Typography>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        You are securely logged in.
      </Typography>
      <Button variant="contained" color="error" onClick={handleLogout} sx={{ mt: 4 }}>
        Logout
      </Button>
    </Box>
  );
};

export default DashboardPage;