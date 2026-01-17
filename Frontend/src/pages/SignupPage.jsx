import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Container, Paper, Grid, Link, 
  Alert, CircularProgress, Checkbox, FormControlLabel, Radio, RadioGroup, FormControl, FormLabel 
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const SignupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial State matching API requirements
  const [formData, setFormData] = useState({
    store_name: '', store_code: '', contact_phone: '', 
    address: '', city: '', state: '', registration_number: '',
    first_name: '', last_name: '', email: '', 
    password: '', confirm_password: '',
    plan_id: 'basic',
    terms_accepted: false
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- Frontend Validation ---
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match"); setLoading(false); return;
    }
    if (!formData.terms_accepted) {
      setError("You must agree to the Terms of Service"); setLoading(false); return;
    }

    try {
      // Exclude confirm_password before sending
      const { confirm_password, ...signupData } = formData;
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Registration failed');

      // Success: Save token and redirect
      localStorage.setItem('token', data.access_token);
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 6, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 5 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
            Start Your Free Trial
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Create your account to access the GroceryPOS Pro dashboard.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              
              {/* SECTION 1: STORE DETAILS */}
              <Grid item xs={12}><Typography variant="h6" color="primary">Store Information</Typography></Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Store Name" name="store_name" onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Store Code (Optional)" name="store_code" onChange={handleChange} helperText="Leave blank to auto-generate" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Contact Phone" name="contact_phone" onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Registration Number (Optional)" name="registration_number" onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField required fullWidth label="Street Address" name="address" onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="City" name="city" onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="State" name="state" onChange={handleChange} />
              </Grid>

              {/* SECTION 2: OWNER DETAILS */}
              <Grid item xs={12} sx={{ mt: 2 }}><Typography variant="h6" color="primary">Owner Details</Typography></Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="First Name" name="first_name" onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth label="Last Name" name="last_name" onChange={handleChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField required fullWidth type="email" label="Email Address" name="email" onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth type="password" label="Password" name="password" onChange={handleChange} helperText="Min 8 chars, 1 Upper, 1 Special" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField required fullWidth type="password" label="Confirm Password" name="confirm_password" onChange={handleChange} />
              </Grid>

              {/* SECTION 3: SUBSCRIPTION PLAN */}
              <Grid item xs={12} sx={{ mt: 2 }}><Typography variant="h6" color="primary">Select Plan</Typography></Grid>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <RadioGroup row name="plan_id" value={formData.plan_id} onChange={handleChange}>
                    <FormControlLabel value="basic" control={<Radio />} label="Basic (Free)" />
                    <FormControlLabel value="pro" control={<Radio />} label="Professional ($29/mo)" />
                    <FormControlLabel value="enterprise" control={<Radio />} label="Enterprise ($99/mo)" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* SECTION 4: AGREEMENTS */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <FormControlLabel
                  control={<Checkbox name="terms_accepted" onChange={handleChange} />}
                  label="I agree to the Terms of Service and Privacy Policy"
                />
              </Grid>

              {/* SUBMIT */}
              <Grid item xs={12}>
                <Button type="submit" fullWidth variant="contained" size="large" sx={{ py: 1.5, mt: 2 }} disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                </Button>
              </Grid>

              <Grid item xs={12} textAlign="center">
                <Link component={RouterLink} to="/login" variant="body2">
                  Already have an account? Sign In
                </Link>
              </Grid>

            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignupPage;