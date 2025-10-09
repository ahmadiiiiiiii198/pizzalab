Write-Host "Testing WiFi printer..." -ForegroundColor Cyan
Write-Host ""

$wifiPrinter = "POS-80(copy of 2)"

Write-Host "Checking: $wifiPrinter" -ForegroundColor Yellow

$printer = Get-Printer -Name $wifiPrinter -ErrorAction SilentlyContinue

if ($printer) {
    Write-Host "Printer: $($printer.Name)" -ForegroundColor White
    Write-Host "Port: $($printer.PortName)" -ForegroundColor White
    Write-Host "Status: $($printer.PrinterStatus)" -ForegroundColor White
    Write-Host "Jobs: $($printer.JobCount)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Sending test print..." -ForegroundColor Yellow
    
    $testContent = @"
================================
   RURAL PIZZA - WIFI TEST
================================

Test Time: $(Get-Date -Format "HH:mm:ss")
Date: $(Get-Date -Format "dd/MM/yyyy")

This is a WiFi printer test.
If you see this, WiFi works!

================================
"@
    
    $tempFile = "$env:TEMP\wifi-test.txt"
    $testContent | Out-File -FilePath $tempFile -Encoding ASCII
    
    try {
        Get-Content $tempFile | Out-Printer -Name $wifiPrinter
        Write-Host "✅ Print sent to WiFi printer!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Check your Epson printer now!" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
    
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}
else {
    Write-Host "❌ WiFi printer not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done!"
