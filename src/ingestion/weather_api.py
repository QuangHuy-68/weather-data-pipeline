import logging
import requests
import json 

from datetime import datetime
from pathlib import Path

from config.config import (
    API_URL,
    LATITUDE,
    LONGITUDE,
    TIMEZONE,
    RAW_DATA_DIR
)

logger = logging.getLogger(__name__)


# ==========================================
# 1. API parameters
# ==========================================

params = {
    "latitude": LATITUDE,
    "longitude": LONGITUDE,
    "hourly": (
        "temperature_2m,"
        "relative_humidity_2m,"
        "wind_speed_10m,"
        "precipitation"
    ),
    "timezone": TIMEZONE
}


# ==========================================
# 2. Call API
# ==========================================

logger.info(
    f"Calling weather API for "
    f"latitude={LATITUDE}, longitude={LONGITUDE}"
)

try: 
    response = requests.get(
        API_URL,
        params=params
    )

    logger.info(
        f"API response: {response.status_code}"
    )

    response.raise_for_status()

except requests.RequestException as error: 

    logger.error(
        f"Weather API request failed: {error}"
    )

    raise

# ==========================================
# 3. Convert JSON to Python dictionary
# ==========================================

data = response.json()


# ==========================================
# 4. Create raw data directory
# ==========================================

raw_data_dir = Path(RAW_DATA_DIR)

raw_data_dir.mkdir(
    parents=True,
    exist_ok=True
)


# ==========================================
# 5. Create timestamp
# ==========================================

timestamp = datetime.now().strftime(
    "%Y%m%d_%H%M%S"
)


# ==========================================
# 6. Create filename
# ==========================================

filename = f"weather_{timestamp}.json"

filepath = raw_data_dir / filename


# ==========================================
# 7. Save raw data
# ==========================================

with open(
    filepath,
    "w",
    encoding="utf-8"
) as file:
    json.dump(
        data,
        file,
        indent=4
    )

logger.info(
    f"Raw data saved to: {filepath}"
)

print(f"Raw data saved to: {filepath}")