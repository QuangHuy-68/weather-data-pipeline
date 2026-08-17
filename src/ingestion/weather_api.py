import requests
import json 
from datetime import datetime
from pathlib import Path

url = "https://api.open-meteo.com/v1/forecast"

params = {
    "latitude": 10.8231,
    "longitude": 106.6297,
    "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation",
    "timezone": "Asia/Ho_Chi_Minh"
}

# 1. Call API
response = requests.get(url, params=params)

print(response.status_code)

response.raise_for_status()

# 2. Convert JSON to Python dictionary
data = response.json()


# 3. Create raw data directory
raw_data_dir = Path("data/raw")
raw_data_dir.mkdir(parents=True, exist_ok=True)

# 4. Create timestamp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# 5. Create filename
filename = f"weather_{timestamp}.json"
filepath = raw_data_dir / filename

# 6. save raw data 
with open(filepath, "w", encoding="utf-8") as file:
    json.dump(data, file, indent=4)

print(f"Raw data saved to: {filepath}")