# ==============================================================================
# Pulse Dispatch — Secure 1-Click Client Setup
# Builds Docker runtime and completely removes source code from client machine
# ==============================================================================

# Ensure Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Restarting with Administrator privileges..."
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Clear-Host
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "             ⚡ PULSE DISPATCH — SECURE SYSTEM INSTALLER ⚡           " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host ""

# 1. Detect LAN IP
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch 'Loopback|vEthernet|Virtual|WSL|Docker' -and $_.IPAddress -notmatch '^127.|^169.254.' 
} | Select-Object -First 1).IPAddress

if (-not $localIp) { $localIp = "localhost" }

# 2. Open Firewall
Write-Host "[1/4] Configuring Windows Firewall..." -ForegroundColor Cyan
Remove-NetFirewallRule -DisplayName "Pulse Dispatch Web (3000)" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Pulse Dispatch API (4000)" -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Pulse Dispatch Web (3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any | Out-Null
New-NetFirewallRule -DisplayName "Pulse Dispatch API (4000)" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -Profile Any | Out-Null
Write-Host "      ✓ Firewall ports 3000 and 4000 configured." -ForegroundColor Green

# 3. Check Docker
Write-Host "[2/4] Verifying Docker runtime..." -ForegroundColor Cyan
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "      [!] Please install Docker Desktop first: https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    pause
    exit 1
}

# 4. Clone to Temporary Isolation Directory
$tempDir = Join-Path $env:TEMP ("pulse_build_" + (Get-Random))
Write-Host "[3/4] Downloading application packages to secure build sandbox..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

git clone --depth 1 https://github.com/pulok529/SMSSendingAPP.git $tempDir | Out-Null

# 5. Build and Deploy Docker Images
Write-Host "[4/4] Compiling and starting isolated system containers..." -ForegroundColor Cyan
Set-Location $tempDir
docker compose down 2>$null
docker compose up -d --build

# 6. Create Desktop Management Shortcuts (Pure container controllers - ZERO source code)
$desktopPath = [Environment]::GetFolderPath("Desktop")
$controlDir = Join-Path $desktopPath "Pulse_Dispatch_Control"
New-Item -ItemType Directory -Path $controlDir -Force | Out-Null

$startBat = "@echo off`ntitle Start Pulse Dispatch`ndocker start pulse-redis pulse-db pulse-api pulse-web`necho Pulse Dispatch Started!`npause"
$stopBat = "@echo off`ntitle Stop Pulse Dispatch`ndocker stop pulse-web pulse-api pulse-db pulse-redis`necho Pulse Dispatch Stopped.`npause"
$statusBat = "@echo off`ntitle Pulse Dispatch Status`ndocker ps --filter name=pulse`necho.`necho Web Dashboard: http://$($localIp):3000`necho Mobile Gateway: http://$($localIp):4000`npause"

Set-Content -Path (Join-Path $controlDir "Start_Pulse.bat") -Value $startBat
Set-Content -Path (Join-Path $controlDir "Stop_Pulse.bat") -Value $stopBat
Set-Content -Path (Join-Path $controlDir "Check_Status.bat") -Value $statusBat

# 7. PERMANENTLY DELETE SOURCE CODE AND TEMPORARY FILES
Set-Location $env:USERPROFILE
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "      ✓ Build completed. All source code and temporary files securely removed from PC." -ForegroundColor Green

# 8. Finished Banner
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "              🎉 INSTALLATION COMPLETE & RUNNING!                     " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host " 🌐 Web Dashboard:         http://$($localIp):3000" -ForegroundColor Cyan
Write-Host " 📱 Mobile Gateway Server: http://$($localIp):4000" -ForegroundColor Yellow
Write-Host ""
Write-Host " Control shortcuts have been created on your Desktop under 'Pulse_Dispatch_Control'." -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Press any key to finish..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
