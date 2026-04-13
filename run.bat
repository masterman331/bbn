@echo off
echo.
echo ================================
echo   BBN - Big Bullshit News
echo ================================
echo.

if "%1"=="generate" (
  shift
  node cli\generate.js %*
) else if "%1"=="fetch-images" (
  node imageFetcher.js fetch-all
) else if "%1"=="start" (
  node server.js
) else (
  echo Usage:
  echo   run.bat start                      - Start the news server
  echo   run.bat generate "topic" "desc"    - Generate a new article with images
  echo   run.bat generate "topic" --no-images - Generate without images (faster)
  echo   run.bat fetch-images               - Fetch images for all existing articles
  echo.
  echo Examples:
  echo   run.bat start
  echo   run.bat generate "Why you should gamble your house away NOW!" "Make it believable"
  echo   run.bat fetch-images
)
