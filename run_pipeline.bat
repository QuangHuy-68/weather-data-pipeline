@echo off
chcp 65001 > nul
set PYTHONIOENCODING=utf-8

cd /d D:\weather-data-pipeline
call .venv\Scripts\activate.bat

echo ========================================== >> logs\scheduled_run.log
echo [%date% %time%] Pipeline started >> logs\scheduled_run.log

python pipeline.py >> logs\scheduled_run.log 2>&1

echo [%date% %time%] Pipeline finished >> logs\scheduled_run.log
echo ========================================== >> logs\scheduled_run.log