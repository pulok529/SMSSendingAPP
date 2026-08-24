@echo off
title Pulse Dispatch 1-Click Launcher
echo Starting Pulse Dispatch Setup with Administrator Privileges...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_windows.ps1"
pause
