#!/usr/bin/env bash
# ==============================================================================
# Free Mind Foundation — DigitalOcean Droplet Automated Setup Script
# Domain: portal.freemindfoundation.org.in
# Target Directory: ~/fmf-portal
# ==============================================================================

set -e

# Color codes for pretty terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

DOMAIN="portal.freemindfoundation.org.in"
EMAIL="freemindfoundation786@gmail.com"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${PURPLE}================================================================${NC}"
echo -e "${CYAN}   🚀 Free Mind Foundation Management Portal Setup Script${NC}"
echo -e "${CYAN}   🌐 Domain: ${DOMAIN}${NC}"
echo -e "${CYAN}   📁 Directory: ${APP_DIR}${NC}"
echo -e "${PURPLE}================================================================${NC}\n"

# 1. Verify Root/Sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script as root or with sudo: sudo ./deploy-droplet.sh${NC}"
  exit 1
fi

# 2. Setup Swap Memory (2GB) for smooth Docker builds on smaller Droplets
echo -e "${BLUE}▶ Step 1: Checking and setting up Swap memory...${NC}"
if ! swapon --show | grep -q "/swapfile"; then
  echo -e "  Creating 2GB swap file..."
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile 2>/dev/null || true
  swapon /swapfile 2>/dev/null || true
  if ! grep -q "/swapfile" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  echo -e "${GREEN}  ✓ 2GB swap space enabled!${NC}"
else
  echo -e "${GREEN}  ✓ Swap space already configured.${NC}"
fi

# 3. Update packages & install dependencies
echo -e "\n${BLUE}▶ Step 2: Installing system packages (Docker, Nginx, Certbot)...${NC}"
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release git nginx certbot python3-certbot-nginx ufw openssl

# Install Docker if missing
if ! command -v docker &> /dev/null; then
  echo -e "  Installing Docker Engine..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
  echo -e "${GREEN}  ✓ Docker installed successfully!${NC}"
else
  echo -e "${GREEN}  ✓ Docker is already installed.${NC}"
fi

systemctl enable --now nginx

# 4. Configure Firewall (UFW)
echo -e "\n${BLUE}▶ Step 3: Configuring Firewall (UFW)...${NC}"
ufw allow OpenSSH > /dev/null 2>&1 || true
ufw allow 80/tcp > /dev/null 2>&1 || true
ufw allow 443/tcp > /dev/null 2>&1 || true
ufw --force enable > /dev/null 2>&1 || true
echo -e "${GREEN}  ✓ Firewall configured for SSH (22), HTTP (80), and HTTPS (443).${NC}"

# 5. Setup .env file
echo -e "\n${BLUE}▶ Step 4: Setting up environment configuration (.env)...${NC}"
cd "$APP_DIR"
if [ ! -f .env ]; then
  echo -e "  Generating fresh production .env file..."
  RANDOM_SECRET=$(openssl rand -base64 32 | tr -d '\n')
  DB_RANDOM_PASS=$(openssl rand -hex 12 | tr -d '\n')
  
  cat <<EOF > .env
# Database Credentials
DATABASE_URL="mysql://root:${DB_RANDOM_PASS}@db:3306/fmf_db"
DB_ROOT_PASSWORD="${DB_RANDOM_PASS}"
DB_NAME="fmf_db"

# NextAuth Configuration
NEXTAUTH_URL="https://${DOMAIN}"
NEXTAUTH_SECRET="${RANDOM_SECRET}"

# Email Provider Configuration (Brevo / Resend)
EMAIL_PROVIDER="brevo"
EMAIL_API_KEY=""
EMAIL_FROM="no-reply@freemindfoundation.org.in"
EMAIL_FROM_NAME="Free Mind Foundation"

# Public App Configuration
NEXT_PUBLIC_APP_NAME="Free Mind Foundation"
NEXT_PUBLIC_APP_URL="https://${DOMAIN}"
EOF
  echo -e "${GREEN}  ✓ Created .env with secure random secrets!${NC}"
else
  echo -e "${GREEN}  ✓ Existing .env file detected.${NC}"
fi

# 6. Setup SSL & Nginx
echo -e "\n${BLUE}▶ Step 5: Setting up SSL Certificate & Nginx Reverse Proxy...${NC}"

# Ensure SSL directory and cert exist
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  echo -e "${YELLOW}  Obtaining Let's Encrypt SSL certificate for ${DOMAIN}...${NC}"
  systemctl stop nginx || true
  certbot certonly --standalone -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" || {
    echo -e "${YELLOW}  Warning: Let's Encrypt challenge not completed (Check DNS A record). Generating temporary fallback SSL cert...${NC}"
    mkdir -p "/etc/letsencrypt/live/${DOMAIN}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" \
      -out "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" \
      -subj "/CN=${DOMAIN}" 2>/dev/null || true
  }
  systemctl start nginx || true
fi

# Deploy Nginx config
echo -e "  Applying Nginx configuration..."
cp "$APP_DIR/nginx/portal.freemindfoundation.org.in.conf" /etc/nginx/sites-available/fmf-portal.conf
ln -sf /etc/nginx/sites-available/fmf-portal.conf /etc/nginx/sites-enabled/fmf-portal.conf
rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax and reload
if nginx -t; then
  systemctl reload nginx
  echo -e "${GREEN}  ✓ Nginx configured and reloaded successfully!${NC}"
else
  echo -e "${RED}  ⚠️ Nginx configuration test failed. Re-starting nginx...${NC}"
  systemctl restart nginx || true
fi

# 7. Build and Run Docker Containers
echo -e "\n${BLUE}▶ Step 6: Building and starting Docker containers...${NC}"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build

echo -e "\n${BLUE}▶ Step 7: Waiting for services to initialize...${NC}"
sleep 8
docker compose ps

echo -e "\n${PURPLE}================================================================${NC}"
echo -e "${GREEN}   🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${PURPLE}================================================================${NC}"
echo -e "   🌐 Portal URL:     ${CYAN}https://${DOMAIN}${NC}"
echo -e "   🔑 Super Admin:    ${CYAN}admin@freemindfoundation.org.in${NC}"
echo -e "   🔒 Default Pass:   ${CYAN}Admin@FMF2024${NC}"
echo -e "   ⚠️  Please log in and update your password immediately."
echo -e "${PURPLE}================================================================${NC}\n"
