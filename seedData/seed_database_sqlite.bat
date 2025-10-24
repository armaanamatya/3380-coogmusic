@echo off
echo CoogMusic Database Seeding Script (SQLite)
echo ==========================================

echo.
echo This script will populate your CoogMusic SQLite database with realistic dummy data.
echo.
echo Make sure you have SQLite installed and accessible from command line.
echo.

set /p confirm="Do you want to proceed? (y/n): "
if /i "%confirm%" neq "y" (
    echo Seeding cancelled.
    pause
    exit /b
)

echo.
echo Running database seeding...
echo.

sqlite3 coogmusic.db < run_seed_data.sql

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo Database seeding completed successfully!
    echo ==========================================
) else (
    echo.
    echo ==========================================
    echo Error occurred during seeding.
    echo Please check your SQLite installation and try again.
    echo ==========================================
)

echo.
pause
