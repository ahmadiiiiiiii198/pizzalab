Write-Host "Testing direct print to POS-80C..." -ForegroundColor Cyan
Write-Host ""

# Create simple test content
$testContent = @"
================================
   RURAL PIZZA - TEST PRINT
================================

Test Time: $(Get-Date -Format "HH:mm:ss")
Date: $(Get-Date -Format "dd/MM/yyyy")

This is a test receipt.
If you see this, printer works!

================================
"@

# Save to temp file
$tempFile = "$env:TEMP\test-receipt.txt"
$testContent | Out-File -FilePath $tempFile -Encoding ASCII

Write-Host "Method 1: Trying direct print command..." -ForegroundColor Yellow

try {
    # Try to print directly to the printer
    Get-Content $tempFile | Out-Printer -Name "POS-80C"
    Write-Host "✅ Command sent via Out-Printer" -ForegroundColor Green
}
catch {
    Write-Host "❌ Out-Printer failed: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Method 2: Trying print via default printer..." -ForegroundColor Yellow
    
    try {
        # Set as default and print
        $printer = Get-Printer -Name "POS-80C"
        Set-Printer -Name "POS-80C" -Default
        
        Start-Process -FilePath "notepad.exe" -ArgumentList "/p `"$tempFile`"" -Wait
        Write-Host "✅ Sent via default printer" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Also failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Checking printer status..." -ForegroundColor Yellow

$printer = Get-Printer -Name "POS-80C" -ErrorAction SilentlyContinue

if ($printer) {
    Write-Host "Printer Name: $($printer.Name)" -ForegroundColor White
    Write-Host "Status: $($printer.PrinterStatus)" -ForegroundColor White
    Write-Host "Port: $($printer.PortName)" -ForegroundColor White
    Write-Host "Jobs in Queue: $($printer.JobCount)" -ForegroundColor White
    
    if ($printer.PrinterStatus -ne "Normal") {
        Write-Host ""
        Write-Host "⚠️  Printer status is not Normal!" -ForegroundColor Red
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "  - Printer is turned on" -ForegroundColor White
        Write-Host "  - Paper is loaded" -ForegroundColor White
        Write-Host "  - No paper jams" -ForegroundColor White
        Write-Host "  - Network cable connected" -ForegroundColor White
    }
}

# Cleanup
if (Test-Path $tempFile) {
    Remove-Item $tempFile -Force
}

Write-Host ""
Write-Host "Done!"
