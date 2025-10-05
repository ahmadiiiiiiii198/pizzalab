@echo off
echo Pushing changes to GitHub...

echo.
echo Current git status:
git status --short

echo.
echo Adding changes...
git add src/components/PizzaCustomizationModal.tsx
git add test-personalizata-fix.md

echo.
echo Committing changes...
git commit -m "Fix: Personalizata products add to cart button issue - Fixed state reset and validation logic in PizzaCustomizationModal - Added comprehensive debug logging and test documentation"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo Done! Check the output above for any errors.
pause
