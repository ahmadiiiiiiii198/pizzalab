Write-Host "Testing COM32 Port Direct Communication" -ForegroundColor Cyan
Write-Host "IP: 192.168.1.32" -ForegroundColor Yellow
Write-Host ""

# Create test receipt in ESC/POS format
$ESC = [char]27
$GS = [char]29

$receipt = @"
$ESC@
${ESC}a1${GS}!17RURAL PIZZA
${GS}!00Laboratorio di Pizza
================================

${ESC}a0ORDINE TEST #$(Get-Date -Format "HHmmss")
Data: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

1x Pizza Margherita     EUR 8.00
1x Coca Cola            EUR 3.00
--------------------------------
${GS}!17TOTALE:            EUR 11.00
${GS}!00
${ESC}a1Grazie!
www.ruralpizza.it
================================


${GS}VA03
"@

Write-Host "Attempting to send to COM32..." -ForegroundColor Yellow

try {
    # Try to open COM32 port
    $port = New-Object System.IO.Ports.SerialPort "COM32", 9600, "None", 8, "One"
    $port.Open()
    
    if ($port.IsOpen) {
        Write-Host "✅ COM32 port opened!" -ForegroundColor Green
        
        # Send data
        $port.Write($receipt)
        Start-Sleep -Seconds 1
        
        $port.Close()
        Write-Host "✅ Data sent to printer!" -ForegroundColor Green
        Write-Host "Check your Epson printer for output!" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Try sending via network socket..." -ForegroundColor Yellow
    
    try {
        # Send directly to IP:9100 (raw ESC/POS port)
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect("192.168.1.32", 9100)
        
        if ($client.Connected) {
            Write-Host "✅ Connected to 192.168.1.32:9100" -ForegroundColor Green
            
            $stream = $client.GetStream()
            $writer = New-Object System.IO.StreamWriter($stream)
            $writer.Write($receipt)
            $writer.Flush()
            
            Start-Sleep -Seconds 1
            
            $writer.Close()
            $stream.Close()
            $client.Close()
            
            Write-Host "✅ Data sent via network socket!" -ForegroundColor Green
            Write-Host "Check your printer!" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "❌ Network error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done!"
