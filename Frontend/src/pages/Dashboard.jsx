import React from 'react';
import { 
  Box, Grid, Paper, Typography, Card, CardContent, CardActionArea, 
  Avatar, Divider 
} from '@mui/material';
import { 
  ShoppingCartCheckout, Inventory, People, TrendingUp, Warning 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Quick Action Cards Data
  const actions = [
    { 
      title: "Start Sale (POS)", 
      icon: <ShoppingCartCheckout sx={{ fontSize: 40 }} />, 
      color: "#1976d2", 
      path: "/pos",
      desc: "Open the billing terminal"
    },
    { 
      title: "Manage Inventory", 
      icon: <Inventory sx={{ fontSize: 40 }} />, 
      color: "#2e7d32", 
      path: "/inventory",
      desc: "Add or edit products"
    },
    { 
      title: "Customer Database", 
      icon: <People sx={{ fontSize: 40 }} />, 
      color: "#ed6c02", 
      path: "/customers", // Placeholder path
      desc: "View registered customers"
    },
    { 
      title: "Sales Reports", 
      icon: <TrendingUp sx={{ fontSize: 40 }} />, 
      color: "#9c27b0", 
      path: "/reports", // Placeholder path
      desc: "View daily revenue"
    }
  ];

  return (
    <Box>
      {/* 1. Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {user.first_name || 'Owner'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here is what’s happening in your store today.
        </Typography>
      </Box>

      {/* 2. Key Metrics (Placeholders for now) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Today's Sales</Typography>
              <Typography variant="h4" fontWeight="bold">$0.00</Typography>
            </Box>
            <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
              <TrendingUp />
            </Avatar>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Transactions</Typography>
              <Typography variant="h4" fontWeight="bold">0</Typography>
            </Box>
            <Avatar sx={{ bgcolor: 'secondary.light', width: 56, height: 56 }}>
              <ShoppingCartCheckout />
            </Avatar>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Low Stock Items</Typography>
              <Typography variant="h4" fontWeight="bold" color="error">--</Typography>
            </Box>
            <Avatar sx={{ bgcolor: 'error.light', width: 56, height: 56 }}>
              <Warning />
            </Avatar>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* 3. Quick Actions Grid */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {actions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              elevation={3}
              sx={{ 
                height: '100%', 
                transition: 'transform 0.2s', 
                '&:hover': { transform: 'translateY(-5px)' } 
              }}
            >
              <CardActionArea 
                onClick={() => navigate(action.path)} 
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Box sx={{ color: action.color, mb: 2 }}>
                    {action.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.desc}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardPage;