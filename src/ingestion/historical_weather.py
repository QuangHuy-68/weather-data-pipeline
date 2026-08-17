import json
from pathlib import Path
from datetime import datetime

import requests


# ==========================================
# 1. API configuration
# ==========================================

url = "https://archive-api.open-meteo.com/v1/archive"


params = {
    "latitude": 10.8231,
    "longitude": 106.6297,

    "start_date": "2026-07-01",
    "end_date": "2026-07-30",

    "hourly": (
        "temperature_2m,"
        "relative_humidity_2m,"
        "wind_speed_10m,"
        "precipitation"
    ),

    "timezone": "Asia/Ho_Chi_Minh"
}


# ==========================================
# 2. Request API
# ==========================================

response = requests.get(
    url,
    params=params
)

print("Status:", response.status_code)

response.raise_for_status()

data = response.json()


# ==========================================
# 3. Inspect data
# ==========================================

print("\nKeys:")
print(data.keys())

print("\nHourly keys:")
print(data["hourly"].keys())

print(
    "\nNumber of records:",
    len(data["hourly"]["time"])
)


# ==========================================
# 4. Save raw data
# ==========================================

raw_data_dir = Path("data/raw")

raw_data_dir.mkdir(
    parents=True,
    exist_ok=True
)


timestamp = datetime.now().strftime(
    "%Y%m%d_%H%M%S"
)


output_file = (
    raw_data_dir
    / f"historical_weather_{timestamp}.json"
)


with open(
    output_file,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        data,
        file,
        indent=4
    )


print(
    f"\nRaw data saved to: {output_file}"
)