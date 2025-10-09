# Install Print Server as Windows Service
# Run as Administrator

Write-Host "Installing Print Server as Windows Service..." -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Must run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

# Install node-windows globally
Write-Host "Installing node-windows..." -ForegroundColor Yellow
npm install -g node-windows

# Create service installer script
$serviceScript = @"
var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'RuralPizzaPrintServer',
  description: 'Rural Pizza Automatic Print Server for Epson TM-T70II',
  script: '$PWD\print-server.cjs',
  nodeOptions: []
});

// Listen for the "install" event
svc.on('install', function(){
  console.log('Service installed successfully!');
  svc.start();
});

// Install the service
svc.install();
"@

$serviceScript | Out-File -FilePath "install-service.js" -Encoding UTF8

Write-Host "Installing service..." -ForegroundColor Yellow
node install-service.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Print Server Service Installed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "The print server will now:" -ForegroundColor Cyan
Write-Host "  - Start automatically on Windows boot" -ForegroundColor White
Write-Host "  - Run in the background" -ForegroundColor White
Write-Host "  - Restart if it crashes" -ForegroundColor White
Write-Host ""
Write-Host "Service Name: RuralPizzaPrintServer" -ForegroundColor Yellow
Write-Host ""
Write-Host "To manage the service:" -ForegroundColor Cyan
Write-Host "  - Open Services (services.msc)" -ForegroundColor White
Write-Host "  - Find 'RuralPizzaPrintServer'" -ForegroundColor White
Write-Host "  - Right-click to Start/Stop/Restart" -ForegroundColor White
Write-Host ""

pause
