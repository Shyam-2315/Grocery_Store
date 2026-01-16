import React from 'react';
import Navbar from '../components/common/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features'; // Updated file
import Testimonials from '../components/landing/Testimonials'; // New file
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ'; // New file
import { Box, Typography, Container, Link, Button, TextField, Grid } from '@mui/material';

// Updated Footer to include the "Contact Form" requirement
const Footer = () => (
  <Box component="footer" sx={{ bgcolor: '#1a1a1a', color: 'white', py: 8 }}>
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom color="primary.main">
            GroceryPOS Pro
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            The #1 POS solution for modern grocery retailers. Built for speed, reliability, and growth.
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Quick Links
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Link href="#" color="inherit" underline="hover">Features</Link>
            <Link href="#" color="inherit" underline="hover">Pricing</Link>
            <Link href="#" color="inherit" underline="hover">Login</Link>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            Request a Demo
          </Typography>
          <Box component="form" noValidate>
            <TextField 
              placeholder="Enter your email" 
              variant="outlined" 
              size="small"
              fullWidth
              sx={{ bgcolor: 'white', borderRadius: 1, mb: 1 }}
            />
            <Button variant="contained" fullWidth>Subscribe</Button>
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ borderTop: '1px solid #333', mt: 8, pt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'grey.500' }}>
          {'Copyright © '}
          {new Date().getFullYear()} GroceryPOS Pro. All rights reserved.
        </Typography>
      </Box>
    </Container>
  </Box>
);

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </>
  );
};

export default LandingPage;