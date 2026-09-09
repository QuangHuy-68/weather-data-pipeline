import os 
from dotenv import load_dotenv

load_dotenv()

API_URL = "https://api.open-meteo.com/v1/forecast"


LATITUDE = float(
    os.getenv("LATITUDE", "10.8231")
)

LONGITUDE = float(
    os.getenv("LONGITUDE", "106.6297")
)

TIMEZONE = os.getenv(
    "TIMEZONE", "Asia/Ho_Chi_Minh"
)

RAW_DATA_DIR = "data/raw"

PROCESSED_DATA_DIR = "data/process"

REPORT_DIR = "reports"

CHART_DIR = "reports/charts"

LOG_DIR = "logs"

LOG_FILE = "logs/pipeline.log"

# === Data file paths ===

CLEANED_DATA_FILE = "data/process/weather_cleaned.csv"
FEATURES_FILE = "data/process/weather_features.csv"
FINAL_DATA_FILE = "data/process/weather_final.csv"
FEATURES_V2_FILE = "data/process/weather_features_v2.csv"
DAILY_SUMMARY_FILE = "data/process/weather_daily_summary.csv"

# === Database ===
DB_PATH = "database/weather.db"

# === Output ===
OUTPUT_DATA_DIR = "data/output"

def get_locations() -> list:

    locations_str = os.getenv("LOCATION", "HCM: 10.8231:106.6297")
    locations = []

    for loc in locations_str.split(","):
        parts = loc.strip().split(":")
        locations.append({
            "name": parts[0],
            "latitude": float(parts[1]),
            "longitude": float(parts[2])
        })

    return locations

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

MODEL_DIR = "models"
MODEL_FILE = "models/weather_temp_model.pkl"
PREDICTIONS_FILE = "data/process/weather_predictions.csv"

# === Modern Data Stack (DuckDB & Parquet) ===
PARQUET_DATA_DIR = "data/parquet"
PARQUET_FILE = "data/parquet/weather_analytics.parquet"
DUCKDB_PATH = "database/weather_olap.duckdb"