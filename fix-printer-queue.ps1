Write-Host "Fixing printer queue..." -ForegroundColor Cyan
Write-Host ""

# Clear print queue
Write-Host "Clearing stuck print jobs..." -ForegroundColor Yellow

try {
    # Stop print spooler
    Stop-Service -Name Spooler -Force
    Write-Host "✅ Print spooler stopped" -ForegroundColor Green
    
    Start-Sleep -Seconds 2
    
    # Clear queue files
    $queuePath = "$env:SystemRoot\System32\spool\PRINTERS\*"
    Remove-Item -Path $queuePath -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Queue files cleared" -ForegroundColor Green
    
    # Restart print spooler
    Start-Service -Name Spooler
    Write-Host "✅ Print spooler restarted" -ForegroundColor Green
    
    Start-Sleep -Seconds 2
    
    # Check printer status
    $printer = Get-Printer -Name "POS-80C"
    Write-Host ""
    Write-Host "Printer Status: $($printer.PrinterStatus)" -ForegroundColor Yellow
    Write-Host "Jobs in Queue: $($printer.JobCount)" -ForegroundColor Yellow
    
    if ($printer.PrinterStatus -eq "Normal") {
        Write-Host ""
        Write-Host "✅ Printer is now ready!" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "⚠️  Printer still in error state" -ForegroundColor Red
        Write-Host "Please check the physical printer:" -ForegroundColor Yellow
        Write-Host "  1. Is it powered on?" -ForegroundColor White
        Write-Host "  2. Is paper loaded?" -ForegroundColor White
        Write-Host "  3. Any error lights blinking?" -ForegroundColor White
        Write-Host "  4. Network cable connected?" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done!"
