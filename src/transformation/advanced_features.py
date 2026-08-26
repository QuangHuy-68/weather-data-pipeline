import pandas as pd
import logging

from config.config import FEATURES_V2_FILE, FINAL_DATA_FILE

logger = logging.getLogger(__name__)

def create_advanced_features():

    try:

        # ==========================================
        # 1. Load final dataset
        # ==========================================

        logger.info("Starting advanced feature engineering")

        df = pd.read_csv(FINAL_DATA_FILE)

        df["time"] = pd.to_datetime(df["time"])

        logger.info(f"Loaded final dataset: {len(df)} rows")

        print("Original columns:")
        print(df.columns.tolist())


        # ==========================================
        # 2. Temperature-Humidity Index
        # ==========================================

        df["temp_humidity_index"] = (
            df["temperature"]
            + 0.1 * df["humidity"]
        )

        logger.info("created feature: temp_humidity_index")

        # ==========================================
        # 3. Wind Category
        # ==========================================

        def classify_wind(speed):

            if speed < 10: 
                return "Low"

            elif speed < 20: 
                return "Moderate"

            else: 
                return "High"

        df["wind_category"] = (
            df["wind_speed"]
            .apply(classify_wind)
        )

        logger.info("Created feature: wind_category")

        # ==========================================
        # 4. Rain Intensity
        # ==========================================

        def classify_rain(rain):

            if rain == 0:
                return "No Rain"

            elif rain < 2.5:
                return "Light"

            elif rain < 10: 
                return "Moderate"

            else: 
                return "Heavy"

        df["rain_intensity"] = (
            df["precipitation"]
            .apply(classify_rain)
        )

        logger.info("Created feature: rain_intensity")

        # ==========================================
        # 5. Is Hot
        # ==========================================

        df["is_hot"] = (
            df["temperature"] >= 32
        )

        logger.info("Created feature: í_hot")

        # ==========================================
        # 6. Show new features
        # ==========================================

        print("\n===== NEW FEATURES =====")

        print(
            df[
                [
                    "temperature",
                    "humidity",
                    "wind_speed",
                    "precipitation", 
                    "temp_humidity_index",
                    "wind_category",
                    "rain_intensity",
                    "is_hot"
                ]
            ].head(10)
        )


        # ==========================================
        # 7. Hot hours
        # ==========================================

        hot_hours = (
            df["is_hot"]
            .sum()
        )

        print(
            "\nHot hours:",
            hot_hours
        )

        logger.info(f"Hot hours: {hot_hours}")

        # ==========================================
        # 8. Wind category
        # ==========================================

        print("\n===== WIND CATEGORY =====")

        print(
            df["wind_category"]
            .value_counts()
        )

        logger.info(
            f"Wind category distribution:\n"
            f"{df['wind_category'].value_counts()}"
        )

        # ==========================================
        # 9. Rain intensity
        # ==========================================

        print("\n===== RAIN INTENSITY =====")

        print(
            df["rain_intensity"]
            .value_counts()
        )

        logger.info(
            f"Rain intensity distribution:\n"
            f"{df['rain_intensity'].value_counts()}"
        )

        # ==========================================
        # 10. Save
        # ==========================================

        df.to_csv(
            FEATURES_V2_FILE,
            index=False
        )

        logger.info(
            f"Advanced features saved to:"
            f"{FEATURES_V2_FILE}"
        )

        print(
            f"\nFeature dataset saved to: {FEATURES_V2_FILE}"
        )

        return df

    except FileNotFoundError as e:
        logger.error(f"Input file not found: {e}")
        raise

    except Exception as e:
        logger.error(f"Advanced feature engineering failed: {e}")
        raise

if __name__ == "__main__":
    create_advanced_features()