@echo off
echo ========================================================
echo Veldra Full Workspace Demo Recorder
echo ========================================================
cd C:\Users\CJK_LAPTOP\Personal_Projects\Javascript\veldra

echo.
echo Starting Next.js dev server in the background...
start /B npx next dev -p 3000

echo.
echo Waiting for server to be ready (10 seconds)...
timeout /t 10

echo.
echo Recording workspace demo video...
call npx tsx scripts\demos\record-workspace-demo.ts

echo.
echo ========================================================
echo Demo recording complete! 
echo Converting to webm for the landing page...
for /f "delims=" %%I in ('dir /b /t:c /o:d "demos\videos\*.webm"') do set "LATEST_VIDEO=%%I"
copy /Y "demos\videos\%LATEST_VIDEO%" "public\demos\landing-demo.webm"

echo.
echo Done! Video saved and copied to public\demos\landing-demo.webm
echo You can now close this window (the background dev server will stop when you do).
echo ========================================================
pause
