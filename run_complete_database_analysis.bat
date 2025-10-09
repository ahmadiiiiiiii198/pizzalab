@echo off
echo ============================================================================
echo COMPREHENSIVE DATABASE ANALYSIS SUITE
echo ============================================================================
echo.
echo This script will run a complete analysis of the old database and compare
echo it with the new database to ensure everything has been migrated correctly.
echo.
echo Tools included:
echo 1. Database Structure Study (JavaScript)
echo 2. Database Comparison Tool (JavaScript)
echo 3. SQL Analysis Script (for manual execution)
echo.
echo ============================================================================
echo.

pause

echo.
echo [1/3] Running Database Structure Study...
echo ============================================================================
node run_database_study.js
if errorlevel 1 (
    echo ERROR: Database study failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Running Database Comparison Tool...
echo ============================================================================
node database_comparison_tool.js
if errorlevel 1 (
    echo ERROR: Database comparison failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Analysis Complete!
echo ============================================================================
echo.
echo ✅ Database analysis completed successfully!
echo.
echo Generated files:
echo - database_analysis_[timestamp].json (detailed structure analysis)
echo - database_comparison_report.json (comparison report)
echo.
echo Manual SQL Analysis:
echo - Use comprehensive_database_study.sql in your SQL editor for detailed analysis
echo.
echo Next steps:
echo 1. Review the generated JSON reports
echo 2. Check for any missing components
echo 3. Run the SQL script manually for additional insights
echo.
echo ============================================================================

pause
