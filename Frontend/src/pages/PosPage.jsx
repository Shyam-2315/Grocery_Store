import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Grid, Paper, TextField, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Button, Divider, 
  List, ListItem, ListItemText, Alert, Snackbar
} from '@mui/material';
import { Delete, Add, Remove, Search, ReceiptLong } from '@mui/icons-material';

const PosPage = () => {
  // State
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]); // Local cache for search
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Refs
  const barcodeInputRef = useRef(null);

  // 1. Fetch all products on load (Simple caching strategy)
  useEffect(() => {
    fetchProducts();
  }, []);

  // Focus scanner input on load
  useEffect(() => {
    if(barcodeInputRef.current) barcodeInputRef.current.focus();
  }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products", err);
    }
  };

  // 2. Search & Add to Cart Logic
  const handleScan = (e) => {
    if (e.key === 'Enter') {
      const product = products.find(p => p.barcode === barcode || p.name.toLowerCase() === barcode.toLowerCase());
      
      if (product) {
        addToCart(product);
        setBarcode(''); // Clear input for next scan
      } else {
        alert("Product not found!");
      }
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // 3. Calculation
  const subtotal = cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
  const tax = subtotal * 0.05; // Assuming 5% tax for now
  const total = subtotal + tax;

  // 4. Checkout Logic
  const handleCheckout = async (method) => {
    if (cart.length === 0) return;
    setLoading(true);

    const token = localStorage.getItem('token');
    const payload = {
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.selling_price
      })),
      payment_method: method
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/transactions/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.detail || "Transaction failed");

      setNotification({ open: true, message: `Sale #${data.id} Successful!`, severity: 'success' });
      setCart([]); // Clear cart
      fetchProducts(); // Refresh stock in background
    } catch (err) {
      setNotification({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
      barcodeInputRef.current.focus();
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '85vh', overflow: 'hidden' }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        
        {/* LEFT COLUMN: Search & Scan */}
        <Grid item xs={12} md={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Product Search</Typography>
            
            {/* Scanner Input */}
            <TextField 
              inputRef={barcodeInputRef}
              fullWidth label="Scan Barcode / SKU" variant="outlined" 
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleScan}
              autoFocus
              sx={{ mb: 2, bgcolor: '#e3f2fd' }}
            />

            {/* Manual Search */}
            <TextField 
              fullWidth label="Search by Name" variant="outlined" size="small"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(e.target.value.toLowerCase())));
              }}
            />
            
            {/* Search Results List */}
            <List sx={{ flexGrow: 1, overflow: 'auto', mt: 1 }}>
              {(searchQuery ? filteredProducts : products).slice(0, 10).map((product) => (
                <ListItem button key={product.id} onClick={() => addToCart(product)} divider>
                  <ListItemText 
                    primary={product.name} 
                    secondary={`$${product.selling_price} | Stock: ${product.stock_quantity}`} 
                  />
                  <Add color="primary" fontSize="small" />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* MIDDLE COLUMN: Cart */}
        <Grid item xs={12} md={6} sx={{ height: '100%' }}>
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>Current Transaction</Typography>
            <TableContainer sx={{ flexGrow: 1, bgcolor: '#fff' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="center">Price</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="center">${item.selling_price}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, -1)}><Remove fontSize="small" /></IconButton>
                          <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, 1)}><Add fontSize="small" /></IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="right">${(item.selling_price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton color="error" size="small" onClick={() => removeFromCart(item.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cart.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                        <ReceiptLong sx={{ fontSize: 60, opacity: 0.2 }} />
                        <Typography>Cart is Empty. Scan an item.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: Payment */}
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa' }}>
            <Typography variant="h6" gutterBottom>Payment Summary</Typography>
            
            <Box sx={{ my: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal</Typography>
                <Typography>${subtotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax (5%)</Typography>
                <Typography>${tax.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" fontWeight="bold">Total</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">${total.toFixed(2)}</Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" color="success" size="large" fullWidth 
                onClick={() => handleCheckout('cash')}
                disabled={cart.length === 0 || loading}
              >
                PAY CASH
              </Button>
              <Button 
                variant="contained" color="primary" size="large" fullWidth
                onClick={() => handleCheckout('card')}
                disabled={cart.length === 0 || loading}
              >
                PAY CARD
              </Button>
              <Button 
                variant="outlined" color="error" fullWidth 
                onClick={() => setCart([])}
              >
                CANCEL
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Notification Toast */}
      <Snackbar open={notification.open} autoHideDuration={3000} onClose={() => setNotification({...notification, open: false})}>
        <Alert severity={notification.severity} variant="filled">{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PosPage;