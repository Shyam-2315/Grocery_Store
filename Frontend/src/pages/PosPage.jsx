import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Grid, Paper, TextField, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Button, Divider, 
  List, ListItem, ListItemText, Alert, Snackbar, Autocomplete, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Delete, Add, Remove, Search, ReceiptLong, Print, Person, LocalOffer } from '@mui/icons-material';

const PosPage = () => {
  // State
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]); // Local cache for search
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountType, setDiscountType] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  // Refs
  const barcodeInputRef = useRef(null);

  // 1. Fetch all products and customers on load
  useEffect(() => {
    fetchProducts();
    fetchCustomers();
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

  const fetchCustomers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/customers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error("Error fetching customers", err);
    }
  };

  // 2. Enhanced Barcode Scanner Logic
  const handleScan = async (e) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault();
      
      // Try to find product by barcode first (fastest for barcode scanner)
      let product = products.find(p => p.barcode && p.barcode.trim() === barcode.trim());
      
      // If not found by barcode, try by name
      if (!product) {
        product = products.find(p => p.name.toLowerCase() === barcode.toLowerCase());
      }
      
      // If still not found, try API lookup (in case product was just added)
      if (!product) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`http://127.0.0.1:8000/api/v1/products/by-barcode/${encodeURIComponent(barcode.trim())}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            product = await res.json();
            // Add to local cache
            setProducts([...products, product]);
          }
        } catch (err) {
          console.error("Barcode lookup error:", err);
        }
      }
      
      if (product) {
        // Check stock before adding
        if (product.stock_quantity <= 0) {
          setNotification({ 
            open: true, 
            message: `${product.name} is out of stock!`, 
            severity: 'warning' 
          });
        } else if (product.stock_quantity < cart.find(item => item.id === product.id)?.quantity + 1 || 1) {
          const currentQty = cart.find(item => item.id === product.id)?.quantity || 0;
          if (currentQty >= product.stock_quantity) {
            setNotification({ 
              open: true, 
              message: `Only ${product.stock_quantity} units available!`, 
              severity: 'warning' 
            });
            return;
          }
        }
        
        addToCart(product);
        setBarcode(''); // Clear input for next scan
        // Visual feedback - input briefly highlights
        if (barcodeInputRef.current) {
          barcodeInputRef.current.style.backgroundColor = '#c8e6c9';
          setTimeout(() => {
            if (barcodeInputRef.current) {
              barcodeInputRef.current.style.backgroundColor = '#e3f2fd';
            }
          }, 200);
        }
      } else {
        setNotification({ 
          open: true, 
          message: `Product not found for barcode: ${barcode}`, 
          severity: 'error' 
        });
        setBarcode(''); // Clear for next scan
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
  
  // Calculate discount
  let discountAmount = 0;
  if (discountType && discountValue) {
    if (discountType === 'percentage') {
      discountAmount = subtotal * (parseFloat(discountValue) / 100);
    } else if (discountType === 'fixed') {
      discountAmount = Math.min(parseFloat(discountValue), subtotal);
    }
  }
  
  const total = subtotal + tax - discountAmount;

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
      payment_method: method,
      customer_id: selectedCustomer?.id || null,
      discount_type: discountType || null,
      discount_value: discountType && discountValue ? parseFloat(discountValue) : null
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

      // Fetch transaction details for receipt
      const txnRes = await fetch(`http://127.0.0.1:8000/api/v1/transactions/${data.id}/receipt`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (txnRes.ok) {
        const receiptData = await txnRes.json();
        setLastTransaction(receiptData);
        setReceiptDialogOpen(true);
      }

      setNotification({ open: true, message: `Sale #${data.id} Successful!`, severity: 'success' });
      setCart([]); // Clear cart
      setSelectedCustomer(null);
      setDiscountType('');
      setDiscountValue('');
      fetchProducts(); // Refresh stock in background
    } catch (err) {
      setNotification({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
      barcodeInputRef.current.focus();
    }
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    const receiptContent = generateReceiptHTML(lastTransaction);
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generateReceiptHTML = (transaction) => {
    if (!transaction) return '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${transaction.transaction_id}</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .store-info { font-size: 12px; color: #666; }
          .divider { border-top: 1px dashed #000; margin: 15px 0; }
          .item-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .item-name { flex: 1; }
          .item-price { text-align: right; }
          .total-row { font-weight: bold; font-size: 16px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${transaction.store_name}</div>
          <div class="store-info">${transaction.store_address}</div>
          <div class="store-info">${transaction.store_phone}</div>
        </div>
        <div class="divider"></div>
        <div style="font-size: 12px;">
          <div>Date: ${new Date(transaction.transaction_date).toLocaleString()}</div>
          <div>Transaction #${transaction.transaction_id}</div>
          ${transaction.customer_name ? `<div>Customer: ${transaction.customer_name}</div>` : ''}
          ${transaction.cashier_name ? `<div>Cashier: ${transaction.cashier_name}</div>` : ''}
        </div>
        <div class="divider"></div>
        ${transaction.items.map(item => `
          <div class="item-row">
            <div class="item-name">${item.product_name} x${item.quantity}</div>
            <div class="item-price">$${item.total_price.toFixed(2)}</div>
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="item-row">
          <div>Subtotal:</div>
          <div>$${transaction.subtotal.toFixed(2)}</div>
        </div>
        ${transaction.discount_amount > 0 ? `
          <div class="item-row">
            <div>Discount:</div>
            <div>-$${transaction.discount_amount.toFixed(2)}</div>
          </div>
        ` : ''}
        <div class="item-row total-row">
          <div>TOTAL:</div>
          <div>$${transaction.total_amount.toFixed(2)}</div>
        </div>
        <div style="margin-top: 10px;">
          <div>Payment: ${transaction.payment_method.toUpperCase()}</div>
        </div>
        <div class="divider"></div>
        <div class="footer">
          Thank you for your business!<br>
          Please come again!
        </div>
      </body>
      </html>
    `;
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
            
            {/* Customer Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Person fontSize="small" /> Customer (Optional)
              </Typography>
              <Autocomplete
                size="small"
                options={customers}
                getOptionLabel={(option) => option.name || ''}
                value={selectedCustomer}
                onChange={(e, newValue) => setSelectedCustomer(newValue)}
                renderInput={(params) => <TextField {...params} placeholder="Select customer" />}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      {option.phone && (
                        <Typography variant="caption" color="text.secondary">{option.phone}</Typography>
                      )}
                    </Box>
                  </Box>
                )}
              />
              {selectedCustomer && (
                <Chip 
                  label={`${selectedCustomer.name} - ${selectedCustomer.loyalty_points} pts`}
                  size="small"
                  onDelete={() => setSelectedCustomer(null)}
                  sx={{ mt: 1 }}
                  color="primary"
                />
              )}
            </Box>

            {/* Discount Section */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocalOffer fontSize="small" /> Discount
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={discountType}
                      onChange={(e) => {
                        setDiscountType(e.target.value);
                        if (!e.target.value) setDiscountValue('');
                      }}
                      label="Type"
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="percentage">%</MenuItem>
                      <MenuItem value="fixed">$</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Value"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    disabled={!discountType}
                    InputProps={{
                      startAdornment: discountType === 'percentage' ? '%' : '$'
                    }}
                  />
                </Grid>
              </Grid>
              {discountAmount > 0 && (
                <Chip 
                  label={`Discount: -$${discountAmount.toFixed(2)}`}
                  size="small"
                  color="success"
                  sx={{ mt: 1 }}
                  onDelete={() => {
                    setDiscountType('');
                    setDiscountValue('');
                  }}
                />
              )}
            </Box>
            
            <Box sx={{ my: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal</Typography>
                <Typography>${subtotal.toFixed(2)}</Typography>
              </Box>
              {discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="success.main">Discount</Typography>
                  <Typography color="success.main">-${discountAmount.toFixed(2)}</Typography>
                </Box>
              )}
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

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Receipt #{lastTransaction?.transaction_id}
        </DialogTitle>
        <DialogContent>
          {lastTransaction && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">{lastTransaction.store_name}</Typography>
                <Typography variant="body2" color="text.secondary">{lastTransaction.store_address}</Typography>
                <Typography variant="body2" color="text.secondary">{lastTransaction.store_phone}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                Date: {new Date(lastTransaction.transaction_date).toLocaleString()}
              </Typography>
              {lastTransaction.customer_name && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Customer: {lastTransaction.customer_name}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              {lastTransaction.items.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {item.product_name} x{item.quantity}
                  </Typography>
                  <Typography variant="body2">${item.total_price.toFixed(2)}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>${lastTransaction.subtotal.toFixed(2)}</Typography>
              </Box>
              {lastTransaction.discount_amount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="success.main">Discount:</Typography>
                  <Typography color="success.main">-${lastTransaction.discount_amount.toFixed(2)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontWeight: 'bold' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">${lastTransaction.total_amount.toFixed(2)}</Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Payment: {lastTransaction.payment_method.toUpperCase()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<Print />}
            onClick={handlePrintReceipt}
          >
            Print Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PosPage;