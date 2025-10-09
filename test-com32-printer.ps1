Write-Host "Testing COM32 printer (192.168.1.32)..." -ForegroundColor Cyan
Write-Host ""

# Find printer using COM32
$com32Printer = Get-Printer | Where-Object { $_.PortName -like "*COM32*" }

if ($com32Printer) {
    Write-Host "Found printer on COM32:" -ForegroundColor Green
    Write-Host "Name: $($com32Printer.Name)" -ForegroundColor Yellow
    Write-Host "Port: $($com32Printer.PortName)" -ForegroundColor White
    Write-Host "Status: $($com32Printer.PrinterStatus)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Sending test print..." -ForegroundColor Yellow
    
    $testContent = @"
================================
      RURAL PIZZA
   Laboratorio di Pizza
================================

ORDINE TEST #TEST-$(Get-Date -Format "HHmmss")
Data: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
Tipo: TEST STAMPANTE

CLIENTE: Test Cliente
Tel: +39 123 456 7890

1x Pizza Margherita     EUR 8.00
1x Coca Cola            EUR 3.00
--------------------------------
TOTALE:                EUR 11.00

        Grazie!
      www.ruralpizza.it
================================
"@
    
    $tempFile = "$env:TEMP\com32-test.txt"
    $testContent | Out-File -FilePath $tempFile -Encoding ASCII
    
    try {
        Get-Content $tempFile | Out-Printer -Name $com32Printer.Name
        Write-Host "✅ Print sent successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Check your Epson TM-T70II printer!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Use this printer name in admin panel:" -ForegroundColor Yellow
        Write-Host "$($com32Printer.Name)" -ForegroundColor Green
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
    Write-Host "❌ No printer found on COM32" -ForegroundColor Red
    Write-Host ""
    Write-Host "All printers:" -ForegroundColor White
    Get-Printer | ForEach-Object {
        Write-Host "  - $($_.Name) (Port: $($_.PortName))" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Done!"
