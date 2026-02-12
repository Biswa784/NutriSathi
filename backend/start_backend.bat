@echo off
cd /d "%~dp0"
echo Starting NutriSathi Backend...
echo Current directory: %CD%
uvicorn app.main:app --reload
pause
