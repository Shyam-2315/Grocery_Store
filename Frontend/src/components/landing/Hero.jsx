import React from 'react';
import { Box, Typography, Button, Container, Grid, Stack } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

const Hero = () => {
  return (
    <Box sx={{ bgcolor: 'background.default', pt: 12, pb: 8 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              Manage your grocery store in <span style={{ color: '#1976d2' }}>seconds.</span>
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph sx={{ mb: 4 }}>
              The all-in-one POS system designed for speed. Real-time billing, smart inventory tracking, and sales analytics—even when offline.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" size="large" startIcon={<RocketLaunchIcon />}>
                Start Free Trial
              </Button>
              <Button variant="outlined" size="large">
                View Demo
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            {/* Placeholder for Dashboard Screenshot */}
            <Box
              sx={{
                width: '100%',
                height: 400,
                bgcolor: '#e0e0e0',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 3
              }}
            >
              <Typography color="text.secondary"></Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Hero;