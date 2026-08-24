#!/bin/bash
# ==============================================================================
# Pulse Dispatch — Secure 1-Click Linux Server Installer
# Compiles containers and removes all source code from server
# ==============================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "[!] Please run with sudo: sudo bash install_server_secure.sh"
  exit 1
fi

echo "======================================================================"
echo "          ⚡ PULSE DISPATCH — SECURE SERVER INSTALLER ⚡             "
echo "======================================================================"

# 1. Prerequisites
apt-get update -y && apt-get install -y curl git ufw

if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh && rm -f get-docker.sh
fi

if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# 2. Firewall
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 3000/tcp || true
ufw allow 4000/tcp || true
ufw --force enable || true

# 3. Build in Temp Folder
TEMP_DIR="/tmp/pulse_build_$$"
mkdir -p "$TEMP_DIR"
git clone --depth 1 https://github.com/pulok529/SMSSendingAPP.git "$TEMP_DIR"

cd "$TEMP_DIR"
docker compose down || true
docker compose up -d --build

# 4. Clean up source code completely
cd /root
rm -rf "$TEMP_DIR"
echo "✓ Source code securely cleaned from host."

PUBLIC_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

echo ""
echo "======================================================================"
echo "              🎉 SERVER READY & SECURED!                              "
echo "======================================================================"
echo " 🌐 Web Dashboard:         http://$PUBLIC_IP:3000"
echo " 📱 Mobile Gateway Server: http://$PUBLIC_IP:4000"
echo "======================================================================"
