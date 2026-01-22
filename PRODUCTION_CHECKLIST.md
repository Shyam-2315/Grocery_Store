# 🚀 Production Deployment Checklist

Use this checklist before deploying to production.

## ✅ Pre-Deployment

### Security
- [ ] Changed `SECRET_KEY` to strong random string (32+ characters)
- [ ] Set `DEBUG=False` in backend `.env`
- [ ] Updated `CORS_ORIGINS` with production frontend URL
- [ ] Changed default PostgreSQL password
- [ ] Removed hardcoded credentials from code
- [ ] Enabled HTTPS/SSL certificates
- [ ] Set up firewall rules
- [ ] Disabled API docs in production (`docs_url=None`)

### Database
- [ ] Created production PostgreSQL database
- [ ] Run migration: `python migrate_database.py`
- [ ] Verified all tables created
- [ ] Tested database connection
- [ ] Set up automated backups
- [ ] Tested backup restoration

### Configuration
- [ ] Created `.env` file with production values
- [ ] Verified `.env` is in `.gitignore`
- [ ] Set `ENVIRONMENT=production`
- [ ] Updated `DATABASE_URL` with production credentials
- [ ] Configured proper CORS origins
- [ ] Set up logging directory

### Code
- [ ] All tests passing (if any)
- [ ] No console.log statements in production code
- [ ] Error handling in place
- [ ] Input validation working
- [ ] API endpoints secured with authentication

### Frontend
- [ ] Built production bundle: `npm run build`
- [ ] Tested production build locally
- [ ] Updated API URLs if needed
- [ ] Removed development dependencies
- [ ] Optimized images and assets

## 🔧 Server Setup

### Backend
- [ ] Installed all Python dependencies
- [ ] Created virtual environment
- [ ] Set up systemd service or PM2
- [ ] Configured process manager auto-restart
- [ ] Set up log rotation
- [ ] Configured worker processes (4+ for production)

### Frontend
- [ ] Built production bundle
- [ ] Configured web server (nginx/apache)
- [ ] Set up static file serving
- [ ] Configured caching headers
- [ ] Set up CDN (optional but recommended)

### Infrastructure
- [ ] Set up reverse proxy (nginx)
- [ ] Configured SSL certificates
- [ ] Set up domain name and DNS
- [ ] Configured firewall
- [ ] Set up monitoring/alerting
- [ ] Configured backup system

## 📊 Monitoring

### Health Checks
- [ ] `/health` endpoint responding
- [ ] Database connection verified
- [ ] API responding correctly
- [ ] Frontend loading properly

### Logging
- [ ] Application logs configured
- [ ] Error logs being captured
- [ ] Access logs enabled
- [ ] Log rotation set up

### Performance
- [ ] Database indexes verified
- [ ] Connection pooling configured
- [ ] Response times acceptable
- [ ] Load testing completed

## 🔒 Security Hardening

- [ ] HTTPS enabled and working
- [ ] Firewall configured
- [ ] Fail2ban installed (optional)
- [ ] Regular security updates scheduled
- [ ] Database access restricted
- [ ] API rate limiting (optional)
- [ ] Input sanitization verified

## 📝 Documentation

- [ ] README.md updated
- [ ] Deployment guide created
- [ ] API documentation available
- [ ] Environment variables documented
- [ ] Troubleshooting guide ready

## 🧪 Testing

- [ ] All features tested in production-like environment
- [ ] Barcode scanner tested
- [ ] Payment processing tested
- [ ] Receipt printing tested
- [ ] Error scenarios tested
- [ ] Load testing completed

## 🚀 Deployment

### Final Steps
1. [ ] Backup current production (if updating)
2. [ ] Deploy backend code
3. [ ] Run database migrations
4. [ ] Deploy frontend build
5. [ ] Restart services
6. [ ] Verify health checks
7. [ ] Test critical workflows
8. [ ] Monitor logs for errors

### Post-Deployment
- [ ] Verify all endpoints working
- [ ] Test user login/signup
- [ ] Test product creation
- [ ] Test POS transactions
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Set up alerts

## 📞 Support

- [ ] Support contact information available
- [ ] Error reporting mechanism in place
- [ ] Monitoring dashboard set up
- [ ] Backup restoration tested

---

## Quick Start Commands

### Backend
```bash
cd Backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with production values
python migrate_database.py
python run.py
```

### Frontend
```bash
cd Frontend
npm install
npm run build
# Serve dist/ folder
```

### Production Server
```bash
# Backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Or use systemd service
sudo systemctl start grocerypos
```

---

**Status:** ✅ Ready for Production Deployment
