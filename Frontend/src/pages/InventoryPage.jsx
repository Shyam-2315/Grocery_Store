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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category_id: '',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    min_stock_level: 5,
  });
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [barcodeInputRef, setBarcodeInputRef] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Barcode scanner handler for quick product lookup
  const handleBarcodeSearch = async (e) => {
    if (e.key === 'Enter' && barcodeSearch.trim()) {
      e.preventDefault();
      const token = localStorage.getItem('token');
      
      try {
        // Try to find product by barcode
        const res = await fetch(`http://127.0.0.1:8000/api/v1/products/by-barcode/${encodeURIComponent(barcodeSearch.trim())}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const product = await res.json();
          handleOpenDialog(product);
          setBarcodeSearch('');
          setNotification({ 
            open: true, 
            message: `Found: ${product.name}`, 
            severity: 'success' 
          });
        } else {
          // Product not found - open dialog to create new product with barcode pre-filled
          setFormData({
            name: '',
            barcode: barcodeSearch.trim(),
            category_id: '',
            cost_price: 0,
            selling_price: 0,
            stock_quantity: 0,
            min_stock_level: 5,
          });
          setEditingProduct(null);
          setOpenDialog(true);
          setBarcodeSearch('');
          setNotification({ 
            open: true, 
            message: 'Product not found. Creating new product with this barcode.', 
            severity: 'info' 
          });
        }
      } catch (err) {
        setNotification({ 
          open: true, 
          message: 'Error looking up product', 
          severity: 'error' 
        });
      }
    }
  };

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

  const fetchCategories = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/categories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        category_id: product.category_id || null,
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
        category_id: null,
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
    let value;
    if (e.target.type === 'number') {
      value = parseFloat(e.target.value) || 0;
    } else if (e.target.name === 'category_id') {
      // Handle category_id - convert empty string to null
      value = e.target.value === '' || e.target.value === 'null' ? null : parseInt(e.target.value);
    } else {
      value = e.target.value;
    }
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
    let url = 'http://127.0.0.1:8000/api/v1/products';
    let method = 'POST';

    // If editing, use PUT method
    if (editingProduct) {
      url = `http://127.0.0.1:8000/api/v1/products/${editingProduct.id}`;
      method = 'PUT';
    }

    try {
      // Prepare payload - ensure proper types and handle null values
      const payload = {
        name: formData.name.trim(),
        barcode: formData.barcode && formData.barcode.trim() ? formData.barcode.trim() : null,
        category_id: (formData.category_id === null || formData.category_id === '' || formData.category_id === undefined) 
          ? null 
          : (typeof formData.category_id === 'number' ? formData.category_id : parseInt(formData.category_id)),
        cost_price: typeof formData.cost_price === 'number' ? formData.cost_price : parseFloat(formData.cost_price) || 0.0,
        selling_price: typeof formData.selling_price === 'number' ? formData.selling_price : parseFloat(formData.selling_price) || 0.0,
        stock_quantity: typeof formData.stock_quantity === 'number' ? formData.stock_quantity : parseInt(formData.stock_quantity) || 0,
        min_stock_level: typeof formData.min_stock_level === 'number' ? formData.min_stock_level : parseInt(formData.min_stock_level) || 5,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to save product');
      }

      setNotification({ 
        open: true, 
        message: editingProduct ? 'Product updated successfully!' : 'Product added successfully!', 
        severity: 'success' 
      });
      handleCloseDialog();
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete product');
      }

      setNotification({ open: true, message: 'Product deleted successfully!', severity: 'success' });
      fetchProducts();
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Scan barcode to find/edit product..."
            value={barcodeSearch}
            onChange={(e) => setBarcodeSearch(e.target.value)}
            onKeyDown={handleBarcodeSearch}
            inputRef={(ref) => setBarcodeInputRef(ref)}
            sx={{ 
              minWidth: 300,
              bgcolor: '#e3f2fd',
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#1976d2',
                },
              },
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Product
          </Button>
        </Box>
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
                      <TableCell>
                        <Chip 
                          label={product.category_name || 'Uncategorized'} 
                          size="small"
                          color={product.category_name ? 'primary' : 'default'}
                        />
                      </TableCell>
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
                <FormControl fullWidth>
                  <InputLabel>Category (Optional)</InputLabel>
                  <Select
                    name="category_id"
                    value={formData.category_id === null || formData.category_id === '' ? '' : formData.category_id}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseInt(e.target.value);
                      setFormData({ ...formData, category_id: value });
                    }}
                    label="Category (Optional)"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
