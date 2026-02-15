# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Security
- [Dn] Change `SECRET_KEY` to a strong random string (use: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- [Dn] Set `DEBUG=False` in `.env`
- [Dn] Update `CORS_ORIGINS` with production frontend URL
- [Dn] Use strong PostgreSQL password
- [Dn] Enable HTTPS/SSL certificates
- [Dn] Set up firewall (only allow necessary ports)

### 2. Database
- [ ] Run migration: `python migrate_database.py`
- [ ] Set up database backups (daily recommended)
- [ ] Test database connection
- [ ] Verify all tables created

### 3. Environment
- [ ] Create `.env` file with production values
- [ ] Never commit `.env` to git
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure proper `DATABASE_URL`

### 4. Server
- [ ] Install all dependencies: `pip install -r requirements.txt`
- [ ] Test application locally first
- [ ] Set up process manager (systemd/PM2)
- [ ] Configure reverse proxy (nginx)
- [ ] Set up logging directory

## Deployment Steps

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and PostgreSQL
sudo apt install python3-pip python3-venv postgresql postgresql-contrib nginx

# Install Node.js (for frontend)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Database Setup

```bash
# Create PostgreSQL user and database
sudo -u postgres psql

# In PostgreSQL:
CREATE USER grocerypos_user WITH PASSWORD 'strong_password_here';
CREATE DATABASE grocery_pos OWNER grocerypos_user;
GRANT ALL PRIVILEGES ON DATABASE grocery_pos TO grocerypos_user;
\q
```

### Step 3: Application Setup

```bash
# Create application directory
sudo mkdir -p /var/www/grocerypos
sudo chown $USER:$USER /var/www/grocerypos

# Clone or upload your code
cd /var/www/grocerypos

# Backend setup
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
nano .env  # Edit with production values

# Run migration
python migrate_database.py

# Test run
python run.py  # Should work on port 8000
```

### Step 4: Systemd Service (Backend)

Create `/etc/systemd/system/grocerypos.service`:

```ini
[Unit]
Description=GroceryPOS Backend API
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/grocerypos/Backend
Environment="PATH=/var/www/grocerypos/Backend/venv/bin"
ExecStart=/var/www/grocerypos/Backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable grocerypos
sudo systemctl start grocerypos
sudo systemctl status grocerypos
```

### Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/grocerypos`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        root /var/www/grocerypos/Frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }

    # Static files
    location /static {
        alias /var/www/grocerypos/Frontend/dist;
        expires 30d;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/grocerypos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Step 7: Frontend Build

```bash
cd /var/www/grocerypos/Frontend
npm install
npm run build
# dist/ folder contains production build
```

## Monitoring

### Check Logs

```bash
# Application logs
sudo journalctl -u grocerypos -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Check

```bash
curl http://localhost:8000/health
```

## Backup Strategy

### Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-grocerypos.sh

# Add:
#!/bin/bash
BACKUP_DIR="/var/backups/grocerypos"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U grocerypos_user grocery_pos > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Make executable
sudo chmod +x /usr/local/bin/backup-grocerypos.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-grocerypos.sh
```

## Performance Optimization

1. **Database Indexing** - Already added on key fields
2. **Connection Pooling** - Configured in database.py
3. **Caching** - Consider Redis for production
4. **CDN** - Use CDN for frontend static files
5. **Load Balancing** - Multiple backend workers

## Security Hardening

1. **Firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Fail2Ban:**
   ```bash
   sudo apt install fail2ban
   # Configure for nginx and ssh
   ```

3. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

## Troubleshooting

### Service Won't Start
```bash
sudo systemctl status grocerypos
sudo journalctl -u grocerypos -n 50
```

### Database Connection Issues
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify .env DATABASE_URL
- Test connection: `psql -U grocerypos_user -d grocery_pos`

### 502 Bad Gateway
- Check backend is running: `curl http://localhost:8000/health`
- Check nginx error logs
- Verify proxy_pass URL

## Rollback Procedure

If something goes wrong:

```bash
# Stop service
sudo systemctl stop grocerypos

# Restore database from backup
psql -U grocerypos_user grocery_pos < /var/backups/grocerypos/backup_YYYYMMDD.sql

# Revert code changes
git checkout previous-version

# Restart
sudo systemctl start grocerypos
```

---

**Remember:** Always test in staging environment first!
