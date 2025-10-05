@echo off
echo 🎵 PizzaLab Notification Sound Replacement Tool
echo =============================================

echo.
echo This script will help you replace the current notification sound with the Glovo app sound.
echo.

echo Step 1: Please locate the Glovo app sound file in your Downloads folder
echo Looking for files with "glovo" in the name...
echo.

REM Search for Glovo sound files in Downloads
dir "C:\Users\%USERNAME%\Downloads" /s /b *glovo* 2>nul
if %errorlevel% neq 0 (
    echo No files with "glovo" in the name found in Downloads folder.
    echo.
    echo Please manually locate the Glovo app sound file and note its full path.
    echo Common locations:
    echo - C:\Users\%USERNAME%\Downloads\glovo_app.mp3
    echo - C:\Users\%USERNAME%\Downloads\glovo_app.wav
    echo - C:\Users\%USERNAME%\Downloads\glovo_notification.mp3
    echo - C:\Users\%USERNAME%\Downloads\glovo_notification.wav
    echo.
)

echo.
echo Step 2: Copy the Glovo sound file to the project
echo Please enter the full path to your Glovo sound file:
set /p GLOVO_FILE="Path to Glovo sound file: "

if not exist "%GLOVO_FILE%" (
    echo ❌ Error: File not found: %GLOVO_FILE%
    echo Please check the path and try again.
    pause
    exit /b 1
)

echo.
echo Found Glovo sound file: %GLOVO_FILE%
echo.

REM Get file extension
for %%i in ("%GLOVO_FILE%") do set FILE_EXT=%%~xi

echo File extension: %FILE_EXT%
echo.

REM Backup current notification sounds
echo Step 3: Backing up current notification sounds...
if exist "public\notification-sound.wav" (
    copy "public\notification-sound.wav" "public\notification-sound-backup.wav"
    echo ✅ Backed up notification-sound.wav
)
if exist "public\notification-sound.mp3" (
    copy "public\notification-sound.mp3" "public\notification-sound-backup.mp3"
    echo ✅ Backed up notification-sound.mp3
)

echo.
echo Step 4: Copying Glovo sound as new notification sound...

REM Copy the Glovo file as both WAV and MP3 (the system uses WAV primarily)
if /i "%FILE_EXT%"==".wav" (
    copy "%GLOVO_FILE%" "public\notification-sound.wav"
    echo ✅ Copied Glovo sound as notification-sound.wav
) else if /i "%FILE_EXT%"==".mp3" (
    copy "%GLOVO_FILE%" "public\notification-sound.mp3"
    copy "%GLOVO_FILE%" "public\notification-sound.wav"
    echo ✅ Copied Glovo sound as notification-sound.mp3 and notification-sound.wav
) else (
    REM For other formats, copy as both
    copy "%GLOVO_FILE%" "public\glovo_app%FILE_EXT%"
    copy "%GLOVO_FILE%" "public\notification-sound.wav"
    echo ✅ Copied Glovo sound as notification-sound.wav
)

echo.
echo Step 5: Updating notification sound in database...
echo You may need to update the notification_sounds table in Supabase to use the new sound.
echo.

echo ✅ Notification sound replacement completed!
echo.
echo The Glovo app sound is now set as your notification sound.
echo Restart your development server (npm run dev) to test the new sound.
echo.

echo To test the new sound:
echo 1. Go to the admin panel
echo 2. Navigate to Impostazioni > Notifiche
echo 3. Click the "Test Suono" button
echo.

pause
