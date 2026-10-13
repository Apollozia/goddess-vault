@echo off
cd /d "%~dp0.."
echo Refreshing Instagram profiles (names, followers, avatars)...
node scripts\update-profiles.mjs
if errorlevel 1 (
  echo.
  echo Something went wrong. Is Node.js installed?
  pause
  exit /b 1
)
git add images profiles.json
git diff --cached --quiet || (
  git commit -m "chore: refresh profiles"
  git push
  echo.
  echo Pushed! Your site will update in about a minute.
)
pause
