# Simple Printer Detection (No Admin Required)
Write-Host "🔍 Detecting Printers..." -ForegroundColor Cyan
Write-Host ""

# Get all printers
$printers = Get-Printer -ErrorAction SilentlyContinue

if ($printers) {
    Write-Host "✅ Found $($printers.Count) printer(s):" -ForegroundColor Green
    Write-Host ""
    
    foreach ($printer in $printers) {
        Write-Host "📄 Printer: $($printer.Name)" -ForegroundColor Yellow
        Write-Host "   Port: $($printer.PortName)"
        Write-Host "   Driver: $($printer.DriverName)"
        Write-Host "   Status: $($printer.PrinterStatus)"
        Write-Host ""
    }
    
    # Check for Epson
    $epsonPrinter = $printers | Where-Object {$_.Name -like "*Epson*" -or $_.Name -like "*TM-T20*"}
    
    if ($epsonPrinter) {
        Write-Host "✅ Epson printer detected!" -ForegroundColor Green
        Write-Host "📋 Use this name in your web app:" -ForegroundColor Cyan
        Write-Host "   $($epsonPrinter.Name)" -ForegroundColor Yellow
    }
    else {
        Write-Host "⚠️  No Epson TM-T20III found" -ForegroundColor Yellow
        Write-Host "   Available printers:" -ForegroundColor White
        foreach ($p in $printers) {
            Write-Host "   - $($p.Name)" -ForegroundColor White
        }
    }
}
else {
    Write-Host "❌ No printers found" -ForegroundColor Red
    Write-Host "   Please add a printer in Windows Settings" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
