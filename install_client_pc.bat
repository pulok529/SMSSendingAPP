@echo off
title Pulse Dispatch 1-Click Secure Installer
echo Launching Pulse Dispatch Installer as Administrator...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install_client_pc.ps1"
pause
