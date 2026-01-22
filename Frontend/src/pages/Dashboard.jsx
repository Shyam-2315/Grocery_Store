import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, Card, CardContent, CardActionArea, 
  Avatar, Divider, CircularProgress, Alert, Link
} from '@mui/material';
import { 
  ShoppingCartCheckout, Inventory, People, TrendingUp, Warning 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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

      {/* 2. Key Metrics */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : stats ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Today's Sales</Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {formatCurrency(stats.today_sales)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.today_transactions} transaction{stats.today_transactions !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                <TrendingUp />
              </Avatar>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Monthly Sales</Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatCurrency(stats.monthly_sales)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.monthly_transactions} transaction{stats.monthly_transactions !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                <ShoppingCartCheckout />
              </Avatar>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Total Products</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.total_products}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  in inventory
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'secondary.light', width: 56, height: 56 }}>
                <Inventory />
              </Avatar>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Low Stock Items</Typography>
                <Typography variant="h4" fontWeight="bold" color={stats.low_stock_items > 0 ? 'error' : 'success'}>
                  {stats.low_stock_items}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  need restocking
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: stats.low_stock_items > 0 ? 'error.light' : 'success.light', width: 56, height: 56 }}>
                <Warning />
              </Avatar>
            </Paper>
          </Grid>
        </Grid>
      ) : null}

      <Divider sx={{ mb: 4 }} />

      {/* Quick Stats Link */}
      {stats && (
        <Box sx={{ mb: 3, textAlign: 'right' }}>
          <Link 
            component="button" 
            variant="body2" 
            onClick={() => navigate('/reports')}
            sx={{ textDecoration: 'none' }}
          >
            View Detailed Reports →
          </Link>
        </Box>
      )}

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