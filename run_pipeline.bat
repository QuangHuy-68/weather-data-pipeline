@echo off

cd /d D:\weather-data-pipeline

call .venv\Scripts\activate.bat

python pipeline.py

pause