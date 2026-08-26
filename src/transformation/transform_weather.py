import json
import logging
from pathlib import Path

from config.config import RAW_DATA_DIR, CLEANED_DATA_FILE

import pandas as pd

logger = logging.getLogger(__name__)

def transform_weather():

    """
    Transform raw JSON into cleaned CSV.
    """

    # 1.Find raw data files

    try:

        raw_data_dir = Path(RAW_DATA_DIR)
        
        files = list(raw_data_dir.glob("weather_*.json"))

        if not files: 
            logger.error("No weather JSON files found in data/raw")
            raise FileNotFoundError("No weather JSON files found.")


        # 2.Get latest file
        latest_file = max(files, key=lambda file: file.stat().st_mtime)

        logger.info(f"Reading: {latest_file}")

        # 3. Load JSON
        with open(latest_file, "r", encoding="utf-8") as file:
            data = json.load(file)

        # 4. Get hourly data
        hourly = data["hourly"]

        # 5. Create DataFrame
        df = pd.DataFrame({
            "time": hourly["time"],
            "temperature": hourly["temperature_2m"],
            "humidity": hourly["relative_humidity_2m"],
            "wind_speed": hourly["wind_speed_10m"],
            "precipitation": hourly["precipitation"]
        })

        logger.info(f"Created DataFrame with {len(df)} rows")

        # 6. Data Cleaning
        df_clean = df.copy()

        # Convert time 
        df_clean["time"] = pd.to_datetime(
            df_clean["time"],
            errors="coerce"
        )

        # Convert numeric columns
        numeric_columns = [
            "temperature",
            "humidity",
            "wind_speed",
            "precipitation"
        ]

        for column in numeric_columns:
            df_clean[column] = pd.to_numeric(
                df_clean[column],
                errors="coerce"
            )

        before = len(df_clean)

        # Remove duplicate rows
        df_clean = df_clean.drop_duplicates()
        after = len(df_clean)

        if before != after: 
            logger.warning(f"Removed {before-after} duplicate rows")

        missing = df_clean.isnull().sum()
        if missing.any():
            logger.warning(f"Missing values found:\n{missing}")


        # 8. Save processed data
        processed_dir = Path("data/process")

        processed_dir.mkdir(parents=True, exist_ok=True)

        output_file = Path(CLEANED_DATA_FILE)

        df_clean.to_csv(output_file, index=False)

        logger.info(f"cleaned data saved to: {output_file}")

        print(f"\nCleaned data saved to: {output_file}")

        return df_clean

    except FileNotFoundError as e:
        logger.error(f"Data not found: {e}")
        raise

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON file: {e}")
        raise

    except Exception as e: 
        logger.error(f"Transformation failed: {e}")
        raise 

if __name__ == "__main__": 
    transform_weather()