@echo off
echo 🎵 Setting up Glovo notification sound for PizzaLab
echo ================================================

echo.
echo Looking for Glovo app audio file in project directory...

REM Check for various possible Glovo file names
set GLOVO_FILE=
if exist "glovo_app.mp3" set GLOVO_FILE=glovo_app.mp3
if exist "glovo_app.wav" set GLOVO_FILE=glovo_app.wav
if exist "glovo_notification.mp3" set GLOVO_FILE=glovo_notification.mp3
if exist "glovo_notification.wav" set GLOVO_FILE=glovo_notification.wav
if exist "glovo.mp3" set GLOVO_FILE=glovo.mp3
if exist "glovo.wav" set GLOVO_FILE=glovo.wav

if "%GLOVO_FILE%"=="" (
    echo ❌ Glovo audio file not found in project directory.
    echo.
    echo Please copy the Glovo app audio file to this directory first.
    echo Expected file names:
    echo - glovo_app.mp3
    echo - glovo_app.wav  
    echo - glovo_notification.mp3
    echo - glovo_notification.wav
    echo - glovo.mp3
    echo - glovo.wav
    echo.
    echo You can copy it from desktop using:
    echo copy "C:\Users\%USERNAME%\Desktop\glovo_app.*" .
    echo.
    pause
    exit /b 1
)

echo ✅ Found Glovo audio file: %GLOVO_FILE%
echo.

echo Step 1: Backing up current notification sounds...
if exist "public\notification-sound.wav" (
    copy "public\notification-sound.wav" "public\notification-sound-backup.wav" >nul
    echo ✅ Backed up notification-sound.wav
)
if exist "public\notification-sound.mp3" (
    copy "public\notification-sound.mp3" "public\notification-sound-backup.mp3" >nul
    echo ✅ Backed up notification-sound.mp3
)

echo.
echo Step 2: Installing Glovo sound as notification sound...

REM Copy Glovo file as the new notification sound
copy "%GLOVO_FILE%" "public\notification-sound.wav" >nul
copy "%GLOVO_FILE%" "public\notification-sound.mp3" >nul

echo ✅ Glovo sound installed as notification-sound.wav
echo ✅ Glovo sound installed as notification-sound.mp3

echo.
echo Step 3: Verifying installation...
if exist "public\notification-sound.wav" (
    echo ✅ notification-sound.wav is ready
) else (
    echo ❌ Failed to create notification-sound.wav
)

if exist "public\notification-sound.mp3" (
    echo ✅ notification-sound.mp3 is ready
) else (
    echo ❌ Failed to create notification-sound.mp3
)

echo.
echo 🎉 Glovo notification sound setup completed!
echo.
echo The notification system will now use the Glovo app sound.
echo.
echo To test the new sound:
echo 1. Start the development server: npm run dev
echo 2. Go to admin panel > Impostazioni > Notifiche
echo 3. Click "Test Suono" button
echo.
echo Or create a test order to hear the notification sound in action.
echo.

pause
