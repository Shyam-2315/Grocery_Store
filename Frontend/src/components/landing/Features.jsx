import React from 'react';
import { Box, Container, Grid, Typography, Paper } from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import BarChartIcon from '@mui/icons-material/BarChart';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import StoreIcon from '@mui/icons-material/Store';
import ReceiptIcon from '@mui/icons-material/Receipt';

const features = [
  {
    icon: <FlashOnIcon fontSize="large" color="primary" />,
    title: 'Real-time Billing',
    description: 'Lightning fast checkout designed for keyboard and barcode scanners.'
  },
  {
    icon: <InventoryIcon fontSize="large" color="secondary" />,
    title: 'Smart Inventory',
    description: 'Live stock tracking with automatic low-stock alerts and reordering.'
  },
  {
    icon: <BarChartIcon fontSize="large" color="success" />,
    title: 'Sales Analytics',
    description: 'Understand your profit margins with detailed daily and monthly reports.'
  },
  {
    icon: <WifiOffIcon fontSize="large" color="error" />,
    title: 'Offline Mode',
    description: 'Keep selling even when the internet goes down. Data syncs automatically.'
  },
  // --- NEW FEATURES ADDED BELOW ---
  {
    icon: <StoreIcon fontSize="large" color="warning" />,
    title: 'Multi-Store Support',
    description: 'Manage multiple branches from a single admin dashboard.'
  },
  {
    icon: <ReceiptIcon fontSize="large" color="info" />,
    title: 'Custom Receipts',
    description: 'Add your logo and custom messages to printed thermal receipts.'
  }
];

const Features = () => {
  return (
    <Box sx={{ py: 10, bgcolor: 'white' }}>
      <Container maxWidth="lg">
        <Typography variant="h3" align="center" fontWeight={700} gutterBottom>
          Why GroceryPOS Pro?
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 8 }}>
          Everything you need to run a modern retail business.
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid #eee', borderRadius: 2 }}>
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Features;