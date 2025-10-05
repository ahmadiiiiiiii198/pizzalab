@echo off
echo Starting Git operations...

echo Checking git status...
git status

echo Adding all files...
git add .

echo Committing changes...
git commit -m "Fix notification system and improve user experience - Fixed notification sound system to use only pleasant ringing sound - Removed old audio fallback systems that caused dual sounds - Improved notification sound with classic phone ring pattern - Added database trigger for automatic notification creation - Set toast messages to auto-dismiss after 3 seconds - Removed test buttons from admin interface - Enhanced notification system reliability and user experience"

echo Setting remote origin...
git remote add origin https://github.com/ahmadiiiiiiii198/pizzalab.git

echo Pushing to GitHub...
git push -u origin main

echo Git operations completed!
pause
