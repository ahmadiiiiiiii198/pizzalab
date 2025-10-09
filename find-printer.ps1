Write-Host "Finding printers..." -ForegroundColor Cyan
Write-Host ""

$printers = Get-Printer -ErrorAction SilentlyContinue

if ($printers) {
    Write-Host "Found $($printers.Count) printer(s):" -ForegroundColor Green
    Write-Host ""
    
    foreach ($printer in $printers) {
        Write-Host "Printer: $($printer.Name)" -ForegroundColor Yellow
        Write-Host "Port: $($printer.PortName)"
        Write-Host "Status: $($printer.PrinterStatus)"
        Write-Host ""
    }
    
    $epson = $printers | Where-Object { $_.Name -like "*Epson*" -or $_.Name -like "*TM-T20*" }
    
    if ($epson) {
        Write-Host "EPSON FOUND!" -ForegroundColor Green
        Write-Host "Use this name: $($epson.Name)" -ForegroundColor Yellow
    }
}

Write-Host "Done!"
