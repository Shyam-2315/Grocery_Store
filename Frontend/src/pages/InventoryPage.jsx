import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock_level: 5,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/products', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to fetch products');
      
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setNotification({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        category: product.category || '',
        cost_price: product.cost_price || 0,
        selling_price: product.selling_price || 0,
        stock_quantity: product.stock_quantity || 0,
        min_stock_level: product.min_stock_level || 5,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '',
        category: '',
        cost_price: 0,
        selling_price: 0,
        stock_quantity: 0,
        min_stock_level: 5,
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setError('');
  };

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (formData.selling_price <= 0) {
      setError('Selling price must be greater than 0');
      return;
    }

    const token = localStorage.getItem('token');
    const url = 'http://127.0.0.1:8000/api/v1/products';
    const method = 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to save product');
      }

      setNotification({ open: true, message: 'Product saved successfully!', severity: 'success' });
      handleCloseDialog();
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    const token = localStorage.getItem('token');
    try {
      // Note: Backend doesn't have DELETE endpoint yet, but we'll prepare for it
      setNotification({ open: true, message: 'Delete functionality coming soon', severity: 'info' });
    } catch (err) {
      setNotification({ open: true, message: err.message, severity: 'error' });
    }
  };

  const getStockStatus = (quantity, minLevel) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'error' };
    if (quantity <= minLevel) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Inventory Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Product Name</strong></TableCell>
                <TableCell><strong>Barcode</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell align="right"><strong>Cost Price</strong></TableCell>
                <TableCell align="right"><strong>Selling Price</strong></TableCell>
                <TableCell align="center"><strong>Stock</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No products found. Add your first product!</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity, product.min_stock_level);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.barcode || '-'}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell align="right">${product.cost_price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell align="right">${product.selling_price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell align="center">{product.stock_quantity}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={stockStatus.label}
                          color={stockStatus.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Barcode (Optional)"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cost Price"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  inputProps={{ step: '0.01', min: '0' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Selling Price"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleChange}
                  inputProps={{ step: '0.01', min: '0.01' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stock Quantity"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  inputProps={{ min: '0' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Min Stock Level"
                  name="min_stock_level"
                  value={formData.min_stock_level}
                  onChange={handleChange}
                  inputProps={{ min: '0' }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryPage;
