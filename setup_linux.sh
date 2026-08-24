#!/bin/bash
# ==============================================================================
# Pulse Dispatch — 1-Click Automated Linux/VPS Cloud Server Setup
# For Ubuntu 20.04 / 22.04 / 24.04 & Debian 11 / 12
# Run as root: sudo bash setup_linux.sh
# ==============================================================================

set -e

echo "======================================================================"
echo "       ⚡ PULSE DISPATCH — LINUX CLOUD SERVER SETUP & LAUNCHER ⚡     "
echo "======================================================================"
echo ""

# 1. Check Root
if [ "$EUID" -ne 0 ]; then
  echo "[!] Please run this script with sudo or as root: sudo bash setup_linux.sh"
  exit 1
fi

# 2. Update and Install Prerequisites
echo "[1/5] Installing Prerequisites (curl, git, ufw)..."
apt-get update -y
apt-get install -y curl git ufw iptables

# 3. Install Docker & Docker Compose if missing
if ! command -v docker &> /dev/null; then
    echo "[2/5] Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin
fi

# 4. Configure Firewall (UFW)
echo "[3/5] Configuring Firewall Ports (22, 80, 443, 3000, 4000)..."
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 3000/tcp || true
ufw allow 4000/tcp || true
ufw --force enable || true

# 5. Detect Public IP
PUBLIC_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

# 6. Start Containers
echo "[4/5] Building and Launching Docker Containers..."
docker compose down || true
docker compose up -d --build

echo ""
echo "======================================================================"
echo "              🎉 SERVER IS RUNNING AND FULLY OPERATIONAL!             "
echo "======================================================================"
echo ""
echo " 🌐 1. WEB DASHBOARD URL:"
echo "    http://$PUBLIC_IP:3000"
echo ""
echo " 📱 2. ANDROID COMPANION APP GATEWAY SERVER:"
echo "    http://$PUBLIC_IP:4000"
echo ""
echo " 🔑 3. DEFAULT LOGIN CREDENTIALS:"
echo "    • Superadmin (Owner):  pulak@example.com     / admin12345"
echo "    • Client Tenant Demo:  client@acmeretail.com / clientpassword123"
echo ""
echo "======================================================================"
