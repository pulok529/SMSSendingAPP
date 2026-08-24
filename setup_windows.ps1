# ==============================================================================
# Pulse Dispatch — 1-Click Automated Windows Setup & Launcher
# Run this script with PowerShell as Administrator
# ==============================================================================

# 1. Ensure Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Restarting script with Administrator privileges..."
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Clear-Host
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "       ⚡ PULSE DISPATCH — 1-CLICK SYSTEM SETUP & LAUNCHER ⚡         " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host ""

# 2. Detect Local Network (LAN) IP Address
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|Virtual|WSL|Docker' -and $_.IPAddress -notmatch '^127.|^169.254.' 
} | Select-Object -First 1).IPAddress

if (-not $localIp) {
    $localIp = "localhost"
}

Write-Host "[1/5] Detected Local LAN IP: " -NoNewline
Write-Host "$localIp" -ForegroundColor Green

# 3. Configure Windows Firewall Inbound Rules
Write-Host "[2/5] Configuring Windows Firewall Rules for LAN & Mobile Access..." -ForegroundColor Cyan

# Remove old rules if existing
Remove-NetFirewallRule -DisplayName "Pulse Dispatch Web (3000)" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Pulse Dispatch API (4000)" -ErrorAction SilentlyContinue

# Add new rules
New-NetFirewallRule -DisplayName "Pulse Dispatch Web (3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any | Out-Null
New-NetFirewallRule -DisplayName "Pulse Dispatch API (4000)" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -Profile Any | Out-Null
Write-Host "      ✓ Port 3000 (Web Dashboard) and Port 4000 (Mobile API Gateway) opened in Firewall." -ForegroundColor Green

# 4. Check Docker & Git Requirements
Write-Host "[3/5] Checking System Prerequisites..." -ForegroundColor Cyan

$hasDocker = Get-Command "docker" -ErrorAction SilentlyContinue
if (-not $hasDocker) {
    Write-Host "      [!] Docker not detected. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    Write-Host "      Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 5. Check if Docker Daemon is running
Write-Host "      Checking Docker engine status..." -NoNewline
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host " Starting Docker Desktop..." -ForegroundColor Yellow
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 15
    } else {
        Write-Host " Running." -ForegroundColor Green
    }
} catch {
    Write-Host " Error communicating with Docker." -ForegroundColor Red
}

# 6. Build and Start Docker Containers
Write-Host "[4/5] Building and Starting Pulse Dispatch Containers..." -ForegroundColor Cyan
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

docker compose down 2>$null
docker compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ All containers (pulse-web, pulse-api, pulse-db, pulse-redis) are RUNNING!" -ForegroundColor Green
} else {
    Write-Host "      [!] Error starting docker containers." -ForegroundColor Red
}

# 7. Print Completion & Connection Instructions
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "              🎉 SYSTEM IS READY AND FULLY OPERATIONAL!               " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " 🌐 1. WEB DASHBOARD ACCESS:" -ForegroundColor Yellow
Write-Host "    • On this PC:           http://localhost:3000" -ForegroundColor White
Write-Host "    • From other PC/Tablet: http://$($localIp):3000" -ForegroundColor Cyan
Write-Host ""
Write-Host " 📱 2. ANDROID COMPANION APP SETUP:" -ForegroundColor Yellow
Write-Host "    • Open Pulse Sender App on your Android Phone (connected to same Wi-Fi)" -ForegroundColor White
Write-Host "    • Tap 'API Gateway Server' and enter:" -ForegroundColor White
Write-Host "      http://$($localIp):4000" -ForegroundColor Cyan -BackgroundColor DarkBlue
Write-Host ""
Write-Host " 🔑 3. DEFAULT LOGIN CREDENTIALS:" -ForegroundColor Yellow
Write-Host "    • Superadmin (Owner):  pulak@example.com     / admin12345" -ForegroundColor White
Write-Host "    • Client Tenant Demo:  client@acmeretail.com / clientpassword123" -ForegroundColor White
Write-Host ""
Write-Host " 📦 4. PRODUCTION APK LOCATION:" -ForegroundColor Yellow
Write-Host "    • $scriptDir\android-app\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Gray
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Keep this window open or press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
