from pathlib import Path
import pandas as pd 
import logging

logger = logging.getLogger(__name__)

from config.config import CLEANED_DATA_FILE

def validate_weather():
    """Validate quality of data weather_cleaned.csv"""

    try:
        # 1. Load processed data
        df = pd.read_csv(CLEANED_DATA_FILE)


        # 2. Convert time
        df["time"] = pd.to_datetime(
            df["time"], 
            errors="coerce"
        )


        # 3. Basic information
        logger.info("===== DATA QUALITY REPORT =====")

        logger.info("Rows:", len(df))

        invalid_time = (df["time"].isnull())

        logger.info(
            f"Invalid timestamps: "
            f"{invalid_time.sum()}"
        )

        # 4. Check missing values
        print("\nMissing values:")
        print(df.isnull().sum())


        # 5. Validate temperature
        invalid_temperature = (
            ~df["temperature"].between(-50, 60)
        )


        # 6. Validate humidity
        invalid_humidity = (
            ~df["humidity"].between(0, 100)
        )


        # 7. Validate wind speed
        invalid_wind = (
            df["wind_speed"] < 0
        )


        # 8. Validate precipitation
        invalid_precipitation = (
            df["precipitation"] < 0 
        )


        # 9. Duplicate timestamps 
        duplicate_time = (
            df["time"].duplicated()
        )


        # 10. Print validation results
        print(
            "\nInvalid temperature:",
            invalid_temperature.sum()
        )

        print(
            "Invalid humidity:",
            invalid_humidity.sum()
        )

        print(
            "Invalid wind speed:",
            invalid_wind.sum()
        )

        print(
            "Invalid precipitation:",
            invalid_precipitation.sum()
        )

        print(
            "Duplicate timestamps:",
            duplicate_time.sum()
        )

        # ==========================================
        # 11. Time-series validation
        # ==========================================

        df = df.sort_values("time")

        expected_interval = pd.Timedelta(hours=1)

        time_diff = df["time"].diff()

        invalid_intervals = (
            time_diff.dropna() != expected_interval
        )

        print(
            "Invalid time intervals:", 
            invalid_intervals.sum()
        )


        # ==========================================
        # 12. Find missing timestamps
        # ==========================================

        if invalid_time.sum() == 0:

            expected_times = pd.date_range(
                start=df["time"].min(),
                end=df["time"].max(),
                freq="1h"
            )

            missing_times = expected_times.difference(
                df["time"]
            )

            print(
                "Missing timestamps:",
                len(missing_times)
            )

            if len(missing_times) > 0: 
                print("\nMissing timestamps:")
                print(missing_times)

        logger.info("weather data validation completed")

    except FileNotFoundError as e:

        logger.error(f"Validation file not found: {e}")
        raise

    except Exception as e: 

        logger.error(f"Validation failed: {e}")
        raise

    

if __name__ == "__main__":
    validate_weather()