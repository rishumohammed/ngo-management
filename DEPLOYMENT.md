# Deployment Guide: Free Mind Foundation Portal

This guide provides step-by-step instructions to host **Free Mind Foundation Management Portal** on a Linux VPS / Cloud server (Ubuntu / Debian) using Docker and Nginx with SSL for domain `portal.freemindfoundation.org.in`.

---

## 1. Prerequisites on Server

Ensure the server has:
- **Docker Engine** & **Docker Compose** installed
- **Nginx** installed
- **Certbot** (for free Let's Encrypt SSL certificates)
- DNS A Record configured pointing `portal.freemindfoundation.org.in` to your server's public IP address.

```bash
# On Ubuntu / Debian:
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx git
sudo systemctl enable --now docker nginx
```

---

## 2. Clone the Repository on Server

```bash
cd /opt
sudo git clone https://github.com/rishumohammed/ngo-management.git fmf-portal
cd /opt/fmf-portal
```

---

## 3. Configure Environment Variables

Create your production `.env` file:

```bash
cp .env.example .env
nano .env
```

Set the production credentials:
```env
# Database (inside Docker network)
DATABASE_URL="mysql://root:YourSecurePassword123@db:3306/fmf_db"

# NextAuth
NEXTAUTH_URL="https://portal.freemindfoundation.org.in"
NEXTAUTH_SECRET="generate_a_random_32_character_string"

# Email Provider
EMAIL_PROVIDER="brevo"
EMAIL_API_KEY="your-brevo-api-key"
EMAIL_FROM="no-reply@freemindfoundation.org.in"
EMAIL_FROM_NAME="Free Mind Foundation"

# Public App URLs
NEXT_PUBLIC_APP_NAME="Free Mind Foundation Management"
NEXT_PUBLIC_APP_URL="https://portal.freemindfoundation.org.in"
```

> **Tip:** You can generate a random secret key using:
> ```bash
> openssl rand -base64 32
> ```

---

## 4. Obtain SSL Certificate (Certbot)

Run Certbot to generate the SSL certificate for your domain:

```bash
sudo certbot --nginx -d portal.freemindfoundation.org.in
```

---

## 5. Configure Nginx Reverse Proxy

Copy the provided Nginx configuration file:

```bash
sudo cp nginx/portal.freemindfoundation.org.in.conf /etc/nginx/sites-available/fmf-portal.conf
sudo ln -s /etc/nginx/sites-available/fmf-portal.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Build and Start the Docker Containers

Run docker compose to build the Next.js container and spin up MySQL:

```bash
# Build and run in detached mode
sudo docker compose up -d --build
```

---

## 7. Initialize Database (Push Schema & Seed Admin User)

When starting for the first time, initialize the database schema and seed the initial admin account:

```bash
# Push Prisma schema to MySQL
sudo docker compose exec web npx prisma db push

# (Optional) Seed demo/admin data
sudo docker compose exec web npm run db:seed
```

---

## 8. Managing and Updating the Application

### View Logs:
```bash
sudo docker compose logs -f web
```

### Restart App:
```bash
sudo docker compose restart
```

### Pulling Latest Updates & Rebuilding:
```bash
cd /opt/fmf-portal
git pull origin main
sudo docker compose up -d --build
```
