# 🚀 Quick Start Guide

## First Time Setup (5 Minutes)

### 1. Backend Setup

```bash
cd Backend

# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh

# Or manually:
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
python migrate_database.py
python run.py
```

### 2. Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

### 3. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (when DEBUG=True)

## 🔑 First Steps

1. **Sign Up** - Create your store account
2. **Add Categories** - Go to Categories page, add product categories
3. **Add Products** - Go to Inventory, add products with barcodes
4. **Test POS** - Go to POS Terminal, scan products
5. **View Reports** - Check Dashboard and Reports pages

## 📝 Important Files

- `Backend/.env` - Environment variables (create from .env.example)
- `Backend/migrate_database.py` - Run this first time
- `README.md` - Full documentation
- `PRODUCTION_CHECKLIST.md` - Before deploying

## ⚠️ Common Issues

**Database Error:**
- Run: `python migrate_database.py`
- Check PostgreSQL is running
- Verify .env DATABASE_URL

**422 Error:**
- Fixed! Should work now with updated validators

**Port Already in Use:**
- Change PORT in .env
- Or kill process using port 8000

## 🎯 Next Steps

1. Complete setup above
2. Test all features
3. Review PRODUCTION_CHECKLIST.md
4. Deploy when ready!

---

**You're all set!** 🎉
