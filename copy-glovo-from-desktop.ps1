# PowerShell script to copy Glovo app sound from desktop
Write-Host "🎵 Copying Glovo app sound from desktop..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$desktopPath = [Environment]::GetFolderPath("Desktop")
$projectPath = Get-Location

Write-Host ""
Write-Host "Desktop path: $desktopPath" -ForegroundColor Yellow
Write-Host "Project path: $projectPath" -ForegroundColor Yellow
Write-Host ""

# Search for Glovo audio files on desktop
$glovoFiles = Get-ChildItem -Path $desktopPath -Filter "*glovo*" -Include "*.mp3", "*.wav", "*.m4a", "*.aac"

if ($glovoFiles.Count -eq 0) {
    Write-Host "❌ No Glovo audio files found on desktop." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check if the file exists and has 'glovo' in its name." -ForegroundColor Yellow
    Write-Host "Supported formats: .mp3, .wav, .m4a, .aac" -ForegroundColor Yellow
    Write-Host ""
    
    # List all audio files on desktop for reference
    $allAudioFiles = Get-ChildItem -Path $desktopPath -Include "*.mp3", "*.wav", "*.m4a", "*.aac"
    if ($allAudioFiles.Count -gt 0) {
        Write-Host "Audio files found on desktop:" -ForegroundColor Cyan
        foreach ($file in $allAudioFiles) {
            Write-Host "  - $($file.Name)" -ForegroundColor White
        }
    }
    
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found Glovo audio file(s):" -ForegroundColor Green
foreach ($file in $glovoFiles) {
    Write-Host "  - $($file.Name)" -ForegroundColor White
}

# Use the first file found
$glovoFile = $glovoFiles[0]
Write-Host ""
Write-Host "Using: $($glovoFile.Name)" -ForegroundColor Cyan

# Copy to project directory
try {
    Copy-Item -Path $glovoFile.FullName -Destination $projectPath -Force
    Write-Host "✅ Copied $($glovoFile.Name) to project directory" -ForegroundColor Green
    
    # Now run the setup script
    Write-Host ""
    Write-Host "Running setup script..." -ForegroundColor Cyan
    & ".\setup-glovo-sound.bat"
    
} catch {
    Write-Host "❌ Error copying file: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🎉 Glovo sound setup completed!" -ForegroundColor Green
Read-Host "Press Enter to exit"
