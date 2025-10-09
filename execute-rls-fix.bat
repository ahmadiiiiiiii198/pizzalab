@echo off
echo 🚀 Executing RLS fix directly...

REM Read environment variables
for /f "tokens=2 delims==" %%a in ('findstr "VITE_SUPABASE_URL" .env') do set SUPABASE_URL=%%a
for /f "tokens=2 delims==" %%a in ('findstr "VITE_SUPABASE_ANON_KEY" .env') do set SUPABASE_KEY=%%a

echo 📡 Supabase URL: %SUPABASE_URL%
echo 🔑 API Key: %SUPABASE_KEY:~0,20%...

REM Create SQL file
echo DROP POLICY IF EXISTS "Anyone can view reservation history" ON reservation_status_history; > rls_fix.sql
echo CREATE POLICY "Public can view reservation history" ON reservation_status_history FOR SELECT USING (true); >> rls_fix.sql
echo CREATE POLICY "System can insert reservation history" ON reservation_status_history FOR INSERT WITH CHECK (true); >> rls_fix.sql
echo GRANT INSERT ON reservation_status_history TO anon, authenticated; >> rls_fix.sql
echo GRANT UPDATE ON reservations TO anon, authenticated; >> rls_fix.sql

echo ✅ SQL file created: rls_fix.sql

REM Try to execute via curl if available
curl --version >nul 2>&1
if %errorlevel% == 0 (
    echo 🌐 Executing via curl...
    curl -X POST "%SUPABASE_URL%/rest/v1/rpc/exec_sql" ^
         -H "Content-Type: application/json" ^
         -H "apikey: %SUPABASE_KEY%" ^
         -H "Authorization: Bearer %SUPABASE_KEY%" ^
         -d "{\"sql\": \"$(type rls_fix.sql)\"}"
    
    if %errorlevel% == 0 (
        echo ✅ RLS fix executed successfully!
    ) else (
        echo ❌ Curl execution failed
    )
) else (
    echo ❌ Curl not available
)

echo.
echo 📋 MANUAL EXECUTION REQUIRED:
echo    1. Go to Supabase Dashboard → SQL Editor
echo    2. Copy and paste the contents of rls_fix.sql
echo    3. Click RUN to execute
echo.
echo 📄 SQL file location: %cd%\rls_fix.sql
pause
