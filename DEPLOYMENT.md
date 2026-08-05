# Free Mind Foundation — DigitalOcean Production Deployment Guide

Complete step-by-step guide to hosting the **Free Mind Foundation Management Portal** on a fresh **DigitalOcean Droplet** (Ubuntu 22.04 / 24.04 LTS) with **Docker**, **MySQL**, **Nginx Reverse Proxy**, and **Let's Encrypt SSL** for:

👉 **`https://portal.freemindfoundation.org.in`**

Target Droplet Directory: `~/fmf-portal` (i.e. `/root/fmf-portal`)

---

## ⚡ Option A: Quick 1-Command Automated Setup (Recommended)

Once you connect to your fresh DigitalOcean Droplet:

```bash
# 1. Clone repository directly into ~/fmf-portal
cd ~
git clone https://github.com/rishumohammed/ngo-management.git fmf-portal
cd ~/fmf-portal

# 2. Make setup script executable and run it
chmod +x deploy-droplet.sh
sudo ./deploy-droplet.sh
```

The script will automatically configure 2GB swap space, install Docker & Nginx, set up SSL, configure `.env`, start containers, migrate the database schema, and seed the initial Super Admin account!

---

## 🛠️ Option B: Step-by-Step Manual Setup

If you prefer to run each step manually, follow the instructions below:

---

### Step 1: Point DNS A Record to Droplet IP

In your domain registrar / DNS provider (Cloudflare, GoDaddy, Namecheap, etc.):

1. Add an **A Record**:
   - **Type**: `A`
   - **Name**: `portal` (or `portal.freemindfoundation.org.in`)
   - **Value / Points to**: `<YOUR_DIGITALOCEAN_DROPLET_IP>`
   - **TTL**: Auto / 300s

*(If using Cloudflare, start with Proxy Status set to **DNS Only** (Gray cloud) so Certbot can verify domain ownership during initial certificate issue).*

---

### Step 2: Connect to Droplet & Setup Swap Memory

Connect via SSH:
```bash
ssh root@<YOUR_DROPLET_IP>
```

#### 2.1 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

#### 2.2 Setup 2GB Swap Memory (Recommended for 1GB/2GB Droplets)
Prevents out-of-memory errors during Docker Next.js standalone builds:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

### Step 3: Install Docker, Nginx & Certbot

Install official Docker Engine, Compose plugin, Nginx web server, and Certbot:

```bash
# 1. Install prerequisites & tools
sudo apt install -y ca-certificates curl gnupg lsb-release git nginx certbot python3-certbot-nginx ufw openssl

# 2. Add Docker's official GPG key & repository
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Install Docker Engine & Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. Enable Docker & Nginx services
sudo systemctl enable --now docker nginx
```

#### 3.1 Setup UFW Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

### Step 4: Clone Repository into `~/fmf-portal`

```bash
cd ~
git clone https://github.com/rishumohammed/ngo-management.git fmf-portal
cd ~/fmf-portal
```

---

### Step 5: Configure Production Environment (`.env`)

Create your `.env` file from the provided example:

```bash
cp .env.example .env
nano .env
```

Generate secure secrets and configure your `.env`:

```env
# Database Credentials (MySQL inside Docker Network)
DATABASE_URL="mysql://root:YourSecurePassword123@db:3306/fmf_db"
DB_ROOT_PASSWORD="YourSecurePassword123"
DB_NAME="fmf_db"

# NextAuth Authentication
NEXTAUTH_URL="https://portal.freemindfoundation.org.in"
NEXTAUTH_SECRET="generate_a_random_32_character_string_here"

# Email Provider Configuration (Brevo / Resend)
EMAIL_PROVIDER="brevo"
EMAIL_API_KEY=""
EMAIL_FROM="no-reply@freemindfoundation.org.in"
EMAIL_FROM_NAME="Free Mind Foundation"

# Public App URLs
NEXT_PUBLIC_APP_NAME="Free Mind Foundation"
NEXT_PUBLIC_APP_URL="https://portal.freemindfoundation.org.in"
```

> 💡 **Generate a 32-character random secret:**
> ```bash
> openssl rand -base64 32
> ```

---

### Step 6: Obtain SSL Certificate & Setup Nginx Reverse Proxy

#### 6.1 Obtain Let's Encrypt SSL Certificate
```bash
sudo certbot certonly --nginx -d portal.freemindfoundation.org.in
```
Follow prompts, enter your email and accept terms. Certificates are saved to `/etc/letsencrypt/live/portal.freemindfoundation.org.in/`.

#### 6.2 Activate Nginx Configuration
```bash
# Copy and enable the pre-configured Nginx site file
sudo cp ~/fmf-portal/nginx/portal.freemindfoundation.org.in.conf /etc/nginx/sites-available/fmf-portal.conf
sudo ln -sf /etc/nginx/sites-available/fmf-portal.conf /etc/nginx/sites-enabled/fmf-portal.conf

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test syntax and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 7: Build & Start Docker Containers

Start the Next.js application and MySQL database in detached mode:

```bash
cd ~/fmf-portal
sudo docker compose up -d --build
```

Check the status of running containers:
```bash
sudo docker compose ps
```

The application automatically runs database schema synchronization and seeds the Super Admin account on first start!

---

### 🔑 Initial Super Admin Login Credentials

- **URL**: `https://portal.freemindfoundation.org.in/auth/login`
- **Email**: `admin@freemindfoundation.org.in`
- **Password**: `Admin@FMF2024`

> ⚠️ **Important**: Please log in immediately and change the default password under **Settings / Profile**.

---

## 🛠️ Management & Maintenance Cheat Sheet

### 📋 View Application Logs in Real-time
```bash
cd ~/fmf-portal
sudo docker compose logs -f web
```

### 📋 View Database Logs
```bash
cd ~/fmf-portal
sudo docker compose logs -f db
```

### 🔄 Restart Application
```bash
cd ~/fmf-portal
sudo docker compose restart
```

### 🚀 Deploying Future Updates (Git Pull & Rebuild)
Whenever you push new code to GitHub:
```bash
cd ~/fmf-portal
git pull origin main
sudo docker compose up -d --build
```

### 💾 Backup MySQL Database
```bash
sudo docker compose exec db mysqldump -u root -pYourSecurePassword123 fmf_db > ~/fmf_backup_$(date +%F).sql
```

### 🔒 SSL Auto-Renewal Verification
Certbot automatically renews SSL certificates before expiry. Test dry-run:
```bash
sudo certbot renew --dry-run
```
