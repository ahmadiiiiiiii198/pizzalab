Write-Host "🖨️  Testing Epson TM-T88V Printer" -ForegroundColor Cyan
Write-Host "Printer: POS-80C" -ForegroundColor Yellow
Write-Host ""

# Create test receipt content
$testContent = @"
================================
      🍕 RURÀL PIZZA
   Laboratorio di Pizza Italiana
================================

ORDINE TEST #TEST-$(Get-Date -Format "HHmmss")
Data: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")
Tipo: 🧪 TEST STAMPANTE

┌────────────────────────────┐
│ CLIENTE:                   │
│ Nome: Test Cliente         │
│ Tel: +39 123 456 7890      │
└────────────────────────────┘

1x Pizza Margherita     €8.00
1x Coca Cola            €3.00
────────────────────────────
TOTALE:                €11.00

        Grazie!
      www.ruralpizza.it
      ━━━━━━━━━━━━━━
"@

# Save to temp file
$tempFile = "$env:TEMP\rural-pizza-test.txt"
$testContent | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "Sending test print to POS-80C..." -ForegroundColor Yellow

try {
    # Print using notepad (silent print)
    $process = Start-Process -FilePath "notepad.exe" -ArgumentList "/p `"$tempFile`"" -PassThru -WindowStyle Hidden
    
    Write-Host "✅ Print job sent!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Check your Epson printer for output." -ForegroundColor Cyan
    Write-Host "If nothing prints, the printer might be:" -ForegroundColor Yellow
    Write-Host "  - Not set as default" -ForegroundColor White
    Write-Host "  - Out of paper" -ForegroundColor White
    Write-Host "  - Offline" -ForegroundColor White
    
    Start-Sleep -Seconds 3
    
    # Cleanup
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Done!"
