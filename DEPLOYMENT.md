# Free Mind Foundation — DigitalOcean Production Deployment Guide

Complete step-by-step guide to hosting **Free Mind Foundation Management Portal** on a fresh **DigitalOcean Droplet** (Ubuntu 22.04 / 24.04 LTS) with **Docker**, **MySQL**, **Nginx Reverse Proxy**, and **Let's Encrypt SSL** for domain:
👉 **`portal.freemindfoundation.org.in`**

---

## 📌 Architecture Overview

- **Host (DigitalOcean Droplet)**: Runs Nginx (SSL termination, reverse proxy, static caching) and Certbot (automatic SSL renewals).
- **Docker Network**:
  - `web` (Next.js 14 Standalone Container listening on `127.0.0.1:3000`)
  - `db` (MySQL 8.0 Container listening internally on port `3306` with persistent volume `mysql_data`)

---

## Step 1: DNS Setup (Before or During Droplet Setup)

In your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.):
1. Add an **A Record**:
   - **Type**: `A`
   - **Name / Host**: `portal` (or `portal.freemindfoundation.org.in`)
   - **Value / Points to**: `<YOUR_DIGITALOCEAN_DROPLET_IP>`
   - **TTL**: Auto / 300s

*(If using Cloudflare, you can start with Proxy Status set to **DNS Only** (Gray cloud) to let Certbot obtain the initial certificate easily, or Full (Strict) SSL).*

---

## Step 2: Connect to Droplet & Initial Server Setup

SSH into your fresh DigitalOcean Droplet as `root`:
```bash
ssh root@<YOUR_DROPLET_IP>
```

### 2.1 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Setup 2GB Swap Memory (Recommended for 1GB/2GB Droplets)
Prevents out-of-memory errors during Docker Next.js image builds:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Step 3: Install Docker, Nginx & Certbot

Install official Docker engine, Docker Compose plugin, Nginx, and Certbot:

```bash
# Install prerequisites & tools
sudo apt install -y ca-certificates curl gnupg lsb-release git nginx certbot python3-certbot-nginx ufw

# Add Docker's official GPG key & repository
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify Docker installation
sudo systemctl enable --now docker nginx
sudo docker --version
sudo docker compose version
```

### 3.1 Setup UFW Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## Step 4: Clone the Repository

Clone the project into `/opt/fmf-portal`:

```bash
cd /opt
sudo git clone https://github.com/rishumohammed/ngo-management.git fmf-portal
cd /opt/fmf-portal
```

---

## Step 5: Configure Production Environment (`.env`)

Create your `.env` file from the provided example:

```bash
cp .env.example .env
nano .env
```

Set your production values (press `Ctrl+O` then `Enter` to save, `Ctrl+X` to exit):

```env
# Database Credentials
DATABASE_URL="mysql://root:YourSecurePassword123@db:3306/fmf_db"
DB_ROOT_PASSWORD="YourSecurePassword123"
DB_NAME="fmf_db"

# NextAuth Configuration
NEXTAUTH_URL="https://portal.freemindfoundation.org.in"
NEXTAUTH_SECRET="generate_a_random_32_character_string_here"

# Email Provider Configuration (Brevo / Resend)
EMAIL_PROVIDER="brevo"
EMAIL_API_KEY="your-brevo-or-resend-api-key"
EMAIL_FROM="no-reply@freemindfoundation.org.in"
EMAIL_FROM_NAME="Free Mind Foundation"

# Public App URLs
NEXT_PUBLIC_APP_NAME="Free Mind Foundation"
NEXT_PUBLIC_APP_URL="https://portal.freemindfoundation.org.in"
```

> 💡 **Tip to generate a strong NextAuth secret:**
> ```bash
> openssl rand -base64 32
> ```

---

## Step 6: Obtain SSL Certificate & Setup Nginx

### 6.1 Obtain Let's Encrypt SSL Certificate
Ensure your DNS `portal.freemindfoundation.org.in` points to your Droplet IP, then run:

```bash
sudo certbot certonly --nginx -d portal.freemindfoundation.org.in
```
Follow the prompt, enter your email, and accept the terms. Certbot will place SSL certificates in `/etc/letsencrypt/live/portal.freemindfoundation.org.in/`.

### 6.2 Activate Nginx Configuration
Link the pre-configured Nginx site file from the repository:

```bash
sudo cp /opt/fmf-portal/nginx/portal.freemindfoundation.org.in.conf /etc/nginx/sites-available/fmf-portal.conf
sudo ln -sf /etc/nginx/sites-available/fmf-portal.conf /etc/nginx/sites-enabled/fmf-portal.conf

# Remove default Nginx site if active
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 7: Build and Start the Docker Containers

Now start the Next.js app and MySQL database with Docker Compose:

```bash
cd /opt/fmf-portal
sudo docker compose up -d --build
```

Check the status of running containers:
```bash
sudo docker compose ps
```
You should see `fmf_portal_web` and `fmf_portal_db` running and healthy.

---

## Step 8: Initialize Database Schema & Seed Super Admin

Once the containers are up, push the Prisma database schema and create the default Super Admin user:

```bash
# 1. Push Prisma schema to MySQL
sudo docker compose exec web npx prisma db push

# 2. Seed initial Super Admin account & default settings
sudo docker compose exec web npm run db:seed
```

### 🔑 Initial Super Admin Login Credentials:
- **URL**: `https://portal.freemindfoundation.org.in/auth/login`
- **Email**: `admin@freemindfoundation.org.in`
- **Password**: `Admin@FMF2024`

> ⚠️ **Important**: Log in immediately and change this password under **Settings / Profile**!

---

## 🛠️ Management & Maintenance Commands

### 📋 View Application Logs in Real-time
```bash
cd /opt/fmf-portal
sudo docker compose logs -f web
```

### 📋 View Database Logs
```bash
sudo docker compose logs -f db
```

### 🔄 Restart Application
```bash
cd /opt/fmf-portal
sudo docker compose restart
```

### 🚀 Deploying Future Updates (Git Pull & Rebuild)
Whenever you push new code to GitHub:
```bash
cd /opt/fmf-portal
sudo git pull origin main
sudo docker compose up -d --build
# If schema changed:
sudo docker compose exec web npx prisma db push
```

### 💾 Backup MySQL Database
```bash
sudo docker compose exec db mysqldump -u root -pYourSecurePassword123 fmf_db > /opt/fmf_backup_$(date +%F).sql
```

### 🔒 SSL Auto-Renewal Verification
Certbot automatically renews certificates. You can test renewal with:
```bash
sudo certbot renew --dry-run
```
