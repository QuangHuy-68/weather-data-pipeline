import os 
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://api.open-meteo.com/v1/forecast"

LATITUDE = float(
    os.getenv("LATITUDE")
)

LONGITUDE = float(
    os.getenv("LONGITUDE")
)

TIMEZONE = os.getenv(
    "TIMEZONE"
)

RAW_DATA_DIR = "data/raw"

PROCESSED_DATA_DIR = "data/process"

REPORT_DIR = "reports"

CHART_DIR = "reports/charts"

LOG_DIR = "logs"

LOG_FILE = "logs/pipeline.log"