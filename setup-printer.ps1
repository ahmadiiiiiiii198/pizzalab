# Epson TM-T20III Printer Setup Script
# Run this script as Administrator

Write-Host "🖨️  EPSON TM-T20III Printer Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click the script and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Step 1: Check if printer is connected
Write-Host "Step 1: Checking for connected USB printers..." -ForegroundColor Yellow
$usbPrinters = Get-PnpDevice -Class "Printer" | Where-Object {$_.Status -eq "OK"}

if ($usbPrinters) {
    Write-Host "✅ Found USB printers:" -ForegroundColor Green
    $usbPrinters | ForEach-Object { Write-Host "   - $($_.FriendlyName)" }
} else {
    Write-Host "⚠️  No USB printers detected" -ForegroundColor Yellow
    Write-Host "   Please ensure the Epson TM-T20III is connected via USB" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Check if Epson driver is installed
Write-Host "Step 2: Checking for Epson drivers..." -ForegroundColor Yellow
$epsonDrivers = Get-PrinterDriver | Where-Object {$_.Name -like "*Epson*" -or $_.Name -like "*TM-T20*"}

if ($epsonDrivers) {
    Write-Host "✅ Found Epson drivers:" -ForegroundColor Green
    $epsonDrivers | ForEach-Object { Write-Host "   - $($_.Name)" }
} else {
    Write-Host "⚠️  No Epson drivers found" -ForegroundColor Yellow
    Write-Host "   Please download and install drivers from:" -ForegroundColor Yellow
    Write-Host "   https://epson.com/Support/Printers/POS-Printers/TM-T20III/s/SPT_C31CH51011" -ForegroundColor Cyan
}
Write-Host ""

# Step 3: List all installed printers
Write-Host "Step 3: Listing all installed printers..." -ForegroundColor Yellow
$allPrinters = Get-Printer

if ($allPrinters) {
    Write-Host "✅ Installed printers:" -ForegroundColor Green
    $allPrinters | ForEach-Object {
        Write-Host "   - $($_.Name) (Port: $($_.PortName))" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  No printers installed" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Check for Epson TM-T20III specifically
Write-Host "Step 4: Checking for EPSON TM-T20III..." -ForegroundColor Yellow
$tmPrinter = Get-Printer | Where-Object {$_.Name -like "*TM-T20*" -or $_.Name -like "*EPSON*"}

if ($tmPrinter) {
    Write-Host "✅ Found Epson TM-T20III printer:" -ForegroundColor Green
    Write-Host "   Name: $($tmPrinter.Name)" -ForegroundColor White
    Write-Host "   Port: $($tmPrinter.PortName)" -ForegroundColor White
    Write-Host "   Status: $($tmPrinter.PrinterStatus)" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Use this printer name in the web application:" -ForegroundColor Cyan
    Write-Host "   $($tmPrinter.Name)" -ForegroundColor Yellow
} else {
    Write-Host "❌ EPSON TM-T20III not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 To add the printer manually:" -ForegroundColor Cyan
    Write-Host "   1. Open Settings > Devices > Printers & scanners" -ForegroundColor White
    Write-Host "   2. Click 'Add a printer or scanner'" -ForegroundColor White
    Write-Host "   3. Select your Epson TM-T20III" -ForegroundColor White
    Write-Host "   4. Follow the installation wizard" -ForegroundColor White
}
Write-Host ""

# Step 5: Test print (if printer found)
if ($tmPrinter) {
    Write-Host "Step 5: Would you like to send a test print? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "Y" -or $response -eq "y") {
        Write-Host "Sending test print..." -ForegroundColor Yellow
        
        # Create a simple test file
        $testContent = @"
================================
    PIZZALAB TEST PRINT
================================

Printer: $($tmPrinter.Name)
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

This is a test print to verify
the printer is working correctly.

================================
        Thank you!
================================
"@
        
        $testFile = "$env:TEMP\printer-test.txt"
        $testContent | Out-File -FilePath $testFile -Encoding ASCII
        
        try {
            Start-Process -FilePath "notepad.exe" -ArgumentList "/p `"$testFile`"" -Wait
            Write-Host "✅ Test print sent!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to send test print: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Remove-Item $testFile -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Note the printer name shown above" -ForegroundColor White
Write-Host "2. Open your PizzaLab admin panel" -ForegroundColor White
Write-Host "3. Go to Printer Settings" -ForegroundColor White
Write-Host "4. Enter the printer name" -ForegroundColor White
Write-Host "5. Enable automatic printing" -ForegroundColor White
Write-Host "6. Test the printer from the web interface" -ForegroundColor White
Write-Host ""

pause
