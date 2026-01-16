import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Container, Paper, Checkbox, 
  FormControlLabel, Link, Alert, CircularProgress 
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember_me: false
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Store Token
      localStorage.setItem('token', data.access_token);
      
      // Store User Info (Optional, useful for displaying "Welcome Name")
      localStorage.setItem('user', JSON.stringify(data.user));
      
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5' }}>
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <Box sx={{ m: 1, bgcolor: 'secondary.main', p: 1, borderRadius: '50%' }}>
            <LockOutlinedIcon sx={{ color: 'white' }} />
          </Box>
          
          <Typography component="h1" variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
            Sign in to GroceryPOS
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal" required fullWidth
              id="email" label="Email Address" name="email"
              autoComplete="email" autoFocus
              onChange={handleChange}
            />
            <TextField
              margin="normal" required fullWidth
              name="password" label="Password" type="password"
              id="password" autoComplete="current-password"
              onChange={handleChange}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <FormControlLabel
                control={<Checkbox name="remember_me" color="primary" onChange={handleChange} />}
                label="Remember me"
              />
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit" fullWidth variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
            
            <Box textAlign="center">
              <Link component={RouterLink} to="/signup" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;