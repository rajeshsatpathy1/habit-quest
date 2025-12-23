# Start Habit Quest and Tailscale Serve
# This script starts the backend server in a new window and runs Tailscale Serve in the current one.

Write-Host "🚀 Launching Habit Quest Backend..." -ForegroundColor Cyan
Start-Process node "src/server.js" -WindowStyle Normal

Write-Host "🌐 Starting Tailscale Serve..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop Tailscale Serve (Backend will remain running in its own window)." -ForegroundColor Yellow
tailscale serve http://localhost:3000
