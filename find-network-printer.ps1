Write-Host "Finding which POS-80 is your Epson at 192.168.1.32" -ForegroundColor Cyan
Write-Host ""

$printers = Get-Printer

foreach ($printer in $printers) {
    if ($printer.Name -like "*POS-80*") {
        Write-Host "Checking: $($printer.Name)" -ForegroundColor Yellow
        Write-Host "  Port: $($printer.PortName)" -ForegroundColor White
        
        if ($printer.PortName -like "*192.168*" -or $printer.PortName -like "*68*") {
            Write-Host "  >>> THIS MIGHT BE YOUR EPSON! <<<" -ForegroundColor Green
        }
        Write-Host ""
    }
}

Write-Host "Recommendation:" -ForegroundColor Cyan
Write-Host "Try using: POS-80C" -ForegroundColor Yellow
Write-Host "(Port 192.168.0.68 - closest to your IP)" -ForegroundColor White
