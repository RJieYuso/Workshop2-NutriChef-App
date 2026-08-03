# Get ngrok tunnel URL
$response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
$tunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1

if ($tunnel) {
    $url = $tunnel.public_url
    Write-Host "✅ Ngrok HTTPS URL: $url" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Update your config.js with:" -ForegroundColor Yellow
    Write-Host "PYTHON_BACKEND_URL: '$url'," -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Full URL copied to clipboard (if possible)" -ForegroundColor Gray
    
    # Try to copy to clipboard
    try {
        $url | Set-Clipboard
        Write-Host "✅ URL copied to clipboard!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not copy to clipboard automatically" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ No ngrok tunnel found. Make sure ngrok is running." -ForegroundColor Red
    Write-Host "Run: ngrok http 5002" -ForegroundColor Yellow
}
