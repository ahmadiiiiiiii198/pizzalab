# Configure Epson TM-T88V Network Printer
# IP Address: 192.168.1.32

Write-Host "🖨️  Configuring Epson TM-T88V Network Printer" -ForegroundColor Cyan
Write-Host "IP Address: 192.168.1.32" -ForegroundColor Yellow
Write-Host ""

# Test network connection to printer
Write-Host "Step 1: Testing network connection..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName 192.168.1.32 -Count 2 -Quiet

if ($pingResult) {
    Write-Host "✅ Printer is reachable on network!" -ForegroundColor Green
} else {
    Write-Host "❌ Cannot reach printer at 192.168.1.32" -ForegroundColor Red
    Write-Host "   Please check:" -ForegroundColor Yellow
    Write-Host "   - Printer is powered on" -ForegroundColor White
    Write-Host "   - Network cable is connected" -ForegroundColor White
    Write-Host "   - Printer and computer are on same network" -ForegroundColor White
    exit
}

Write-Host ""
Write-Host "Step 2: Checking existing printer configuration..." -ForegroundColor Yellow

# Check if printer already exists
$existingPrinter = Get-Printer | Where-Object { $_.PortName -like "*192.168.1.32*" }

if ($existingPrinter) {
    Write-Host "✅ Printer already configured:" -ForegroundColor Green
    Write-Host "   Name: $($existingPrinter.Name)" -ForegroundColor White
    Write-Host "   Port: $($existingPrinter.PortName)" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Use this printer name in your web app:" -ForegroundColor Cyan
    Write-Host "   $($existingPrinter.Name)" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  No printer found with IP 192.168.1.32" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available printers:" -ForegroundColor White
    Get-Printer | ForEach-Object {
        Write-Host "   - $($_.Name) (Port: $($_.PortName))" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Step 3: Printer Configuration Summary" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Printer Model: Epson TM-T88V" -ForegroundColor White
Write-Host "IP Address: 192.168.1.32" -ForegroundColor White
Write-Host "Connection: Network (TCP/IP)" -ForegroundColor White
Write-Host "Port: COM32 / TCP/IP Port" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open your PizzaLab admin panel" -ForegroundColor White
Write-Host "2. Go to 'Impostazioni Stampante' tab" -ForegroundColor White
Write-Host "3. Enter the printer name shown above" -ForegroundColor White
Write-Host "4. Enable 'Stampa automatica nuovi ordini'" -ForegroundColor White
Write-Host "5. Click 'Test Stampante' to verify" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
