#!/bin/bash
# BG Remover deployment script for gz server
set -e

echo "=== Setting up BG Remover ==="

# 1. Install systemd service
cp /opt/bg-remover/bg-remover.service /etc/systemd/system/bg-remover.service
systemctl daemon-reload
systemctl enable bg-remover
systemctl restart bg-remover
sleep 1
echo "--- Go backend status ---"
systemctl status bg-remover --no-pager

# 2. Test backend health
echo "--- Testing backend health ---"
curl -s http://127.0.0.1:8081/api/health && echo ""

# 3. Update Nginx config - insert bg-remover locations into games.conf
# Backup first
cp /etc/nginx/conf.d/games.conf /etc/nginx/conf.d/games.conf.bak

# Check if bg-remover config already exists
if grep -q "bg-remover" /etc/nginx/conf.d/games.conf; then
    echo "BG Remover nginx config already exists, skipping..."
else
    # Insert before the first closing brace of the SSL server block
    # We insert after the ssl_dhparam line
    sed -i '/ssl_dhparam.*ssl-dhparams.pem;/r /opt/bg-remover/bg-remover-nginx.conf' /etc/nginx/conf.d/games.conf
    echo "Nginx config inserted."
fi

# 4. Test and reload Nginx
echo "--- Testing Nginx config ---"
nginx -t
echo "--- Reloading Nginx ---"
systemctl reload nginx

echo ""
echo "=== Deployment complete! ==="
echo "Visit: https://twbbb.cn/bg-remover"
echo "API:   https://twbbb.cn/api/health"
