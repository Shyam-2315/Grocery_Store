# GroceryPOS Pro - Complete POS System

A full-featured Point of Sale (POS) system for grocery stores with inventory management, customer tracking, sales analytics, and barcode scanner support.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - Secure signup/login with JWT tokens
- ✅ **Product Management** - Full CRUD with categories and barcode support
- ✅ **POS System** - Real-time billing with barcode scanner integration
- ✅ **Customer Management** - Customer database with loyalty points
- ✅ **Sales Analytics** - Dashboard with real-time statistics
- ✅ **Transaction History** - Complete sales records
- ✅ **Receipt Printing** - Professional receipt generation
- ✅ **Discount System** - Percentage and fixed amount discounts
- ✅ **Category Management** - Organize products by categories
- ✅ **Low Stock Alerts** - Automatic inventory warnings

### Technical Features
- ✅ **Barcode Scanner Support** - USB scanner integration
- ✅ **Real-time Updates** - Live inventory and sales tracking
- ✅ **Multi-tenant Architecture** - Each store has isolated data
- ✅ **RESTful API** - Clean, documented API endpoints
- ✅ **Responsive UI** - Modern Material-UI design
- ✅ **Production Ready** - Environment variables, logging, error handling

## 📋 Prerequisites

- **Python 3.11+**
- **PostgreSQL 12+**
- **Node.js 18+** (for frontend)
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Grocerry_Store
```

### 2. Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
copy .env.example .env
# Linux/Mac: cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL=postgresql://username:password@localhost/grocery_pos
# SECRET_KEY=your-super-secret-key-min-32-chars

# Run database migration
python migrate_database.py

# Start the server
python run.py
# Or: uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## ⚙️ Configuration

### Backend Environment Variables (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost/grocery_pos

# Security (IMPORTANT: Change in production!)
SECRET_KEY=your-super-secret-key-change-this-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS (Add your frontend URLs)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
ENVIRONMENT=production
DEBUG=False

# Server
HOST=0.0.0.0
PORT=8000
```

### Frontend Configuration

Update API URL in frontend files if needed:
- Default: `http://127.0.0.1:8000`
- Change in: `Frontend/src/pages/*.jsx` files

## 🗄️ Database Setup

### PostgreSQL Setup

1. **Install PostgreSQL** (if not installed)
2. **Create Database:**
   ```sql
   CREATE DATABASE grocery_pos;
   ```

3. **Update .env** with your PostgreSQL credentials:
   ```env
   DATABASE_URL=postgresql://username:password@localhost/grocery_pos
   ```

4. **Run Migration:**
   ```bash
   cd Backend
   python migrate_database.py
   ```

## 🚀 Running the Application

### Development Mode

**Backend:**
```bash
cd Backend
python run.py
# Server runs on http://localhost:8000
```

**Frontend:**
```bash
cd Frontend
npm run dev
# App runs on http://localhost:5173
```

### Production Mode

**Backend:**
```bash
cd Backend
# Set ENVIRONMENT=production in .env
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd Frontend
npm run build
# Serve the dist/ folder with nginx or similar
```

## 📱 Usage

### First Time Setup

1. **Start Backend** - Run `python run.py` in Backend folder
2. **Start Frontend** - Run `npm run dev` in Frontend folder
3. **Open Browser** - Navigate to `http://localhost:5173`
4. **Sign Up** - Create your store account
5. **Login** - Access your dashboard

### Using Barcode Scanner

1. **Plug in USB barcode scanner** (no drivers needed)
2. **Go to POS page** or Inventory page
3. **Scan barcode** - Product is automatically found/added
4. **Works like keyboard input** - Scanner types barcode + Enter

### Key Workflows

**Adding Products:**
1. Go to Inventory → Add Product
2. Fill in details (name, price, stock, barcode)
3. Select category (optional)
4. Save

**Processing Sales:**
1. Go to POS Terminal
2. Scan products or search manually
3. Select customer (optional)
4. Apply discount (optional)
5. Choose payment method
6. Complete sale
7. Print receipt

**Viewing Reports:**
1. Go to Reports page
2. View transaction history
3. Check daily/monthly analytics
4. Export data (coming soon)

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change `SECRET_KEY` in `.env` to a strong random string (min 32 chars)
- [ ] Set `DEBUG=False` in production
- [ ] Update `CORS_ORIGINS` with your actual frontend URLs
- [ ] Use strong PostgreSQL password
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register new store
- `POST /api/v1/auth/login` - User login

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/by-barcode/{barcode}` - Get product by barcode
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

### Customers
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `PUT /api/v1/customers/{id}` - Update customer
- `DELETE /api/v1/customers/{id}` - Delete customer

### Transactions
- `POST /api/v1/transactions/create` - Create sale
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/{id}` - Get transaction details
- `GET /api/v1/transactions/{id}/receipt` - Get receipt data

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard statistics
- `GET /api/v1/analytics/sales` - Sales analytics

### Health
- `GET /health` - Health check endpoint
- `GET /api/v1/info` - API information

**API Documentation:** Visit `http://localhost:8000/docs` when DEBUG=True

## 🐛 Troubleshooting

### Database Connection Error
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists: `CREATE DATABASE grocery_pos;`

### 422 Validation Error
- Check all required fields are filled
- Ensure category_id is null (not empty string) if not selected
- Check browser console for detailed error

### Barcode Scanner Not Working
- Test scanner in Notepad first
- Ensure input field is focused
- Check browser permissions for auto-focus

### Migration Errors
- Run migration manually: `python migrate_database.py`
- Check database permissions
- Verify PostgreSQL version (12+)

## 📦 Project Structure

```
GroceryPOS/
├── Backend/
│   ├── main.py              # FastAPI application
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication logic
│   ├── database.py          # Database connection
│   ├── config.py            # Configuration settings
│   ├── migrate_database.py  # Database migration
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables (create from .env.example)
│
├── Frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/       # Reusable components
│   │   ├── layouts/         # Layout components
│   │   └── App.jsx          # Main app component
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
│
└── README.md               # This file
```

## 🚢 Deployment

### Backend Deployment (Example: Ubuntu Server)

```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip postgresql nginx

# Setup application
cd /var/www/grocerypos/Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure .env file
nano .env  # Add production settings

# Run migration
python migrate_database.py

# Use systemd service or PM2
# Example systemd service file in deployment/ folder
```

### Frontend Deployment

```bash
cd Frontend
npm run build
# Serve dist/ folder with nginx or similar
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/grocerypos/Frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Check logs in backend console

## 🎯 Next Steps (Optional Enhancements)

- [ ] Email notifications for low stock
- [ ] Export reports to PDF/Excel
- [ ] Multi-store management
- [ ] Staff/user role management
- [ ] Advanced reporting and charts
- [ ] Mobile app
- [ ] Offline mode support
- [ ] Payment gateway integration

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅
