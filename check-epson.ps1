Write-Host "Checking Epson TM-T88V at 192.168.1.32" -ForegroundColor Cyan
Write-Host ""

# Test connection
Write-Host "Testing network connection..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName 192.168.1.32 -Count 2 -Quiet

if ($ping) {
    Write-Host "SUCCESS: Printer is online!" -ForegroundColor Green
}
else {
    Write-Host "ERROR: Cannot reach printer" -ForegroundColor Red
}

Write-Host ""
Write-Host "Looking for printer in Windows..." -ForegroundColor Yellow

$printers = Get-Printer
$epson = $printers | Where-Object { $_.PortName -like "*192.168.1.32*" -or $_.Name -like "*Epson*" -or $_.Name -like "*TM-T88*" }

if ($epson) {
    Write-Host "FOUND EPSON PRINTER!" -ForegroundColor Green
    Write-Host "Name: $($epson.Name)" -ForegroundColor Yellow
    Write-Host "Port: $($epson.PortName)" -ForegroundColor White
    Write-Host ""
    Write-Host "USE THIS NAME IN WEB APP:" -ForegroundColor Cyan
    Write-Host "$($epson.Name)" -ForegroundColor Yellow
}
else {
    Write-Host "Epson not found in Windows printers" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "All printers:" -ForegroundColor White
    $printers | ForEach-Object { Write-Host "  - $($_.Name)" }
}

Write-Host ""
Write-Host "Done!"
