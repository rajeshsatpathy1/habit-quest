# Stop Habit Quest and Tailscale Serve

Write-Host "Stopping Tailscale Serve..."
# Note: reset requires manual confirmation usually, but we try to do it via stdin
echo "y" | tailscale serve reset

Write-Host "Finding and stopping Habit Quest Backend..."

$nodeProcs = Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like "*node*src/server.js*" }

if ($nodeProcs) {
    foreach ($proc in $nodeProcs) {
        Write-Host "Terminating Process ID: $($proc.ProcessId)"
        Stop-Process -Id $proc.ProcessId -Force
    }
    Write-Host "Backend stopped successfully."
} else {
    Write-Host "No running backend found."
}

Write-Host "Cleanup Complete!"
