import pandas as pd
import logging
from pathlib import Path

from config.config import CLEANED_DATA_FILE, FEATURES_FILE

logger = logging.getLogger(__name__)

def engineer_features():

    try: 
        # ==========================================
        # 1. Load cleaned data
        # ==========================================

        df = pd.read_csv(CLEANED_DATA_FILE)

        logger.info(f"Loaded cleaned data: {len(df)} rows")

        df["time"] = pd.to_datetime(df["time"], errors="coerce")

        invalid_time = (
            df["time"].isnull().sum()
        )

        if invalid_time > 0:

            logger.warning(f"Found {invalid_time} invalid timestamps")

        # ==========================================
        # 2. Time features
        # ==========================================

        df["hour"] = df["time"].dt.hour
        df["day"] = df["time"].dt.day
        df["month"] = df["time"].dt.month
        df["day_of_week"] = (df["time"].dt.dayofweek)
        df["day_name"] = (df["time"].dt.day_name())
        df["is_weekend"] = (df["day_of_week"] >= 5)


        # ==========================================
        # 3. Weather features
        # ==========================================

        df["is_rainy"] = (df["precipitation"] > 0)

        def categorize_temperature(temp): 

            if temp < 20: 
                return "Cold"

            elif temp <= 30:
                return "Moderate"

            else: 
                return "Hot"

        df["temperature_category"] = (
            df["temperature"]
            .apply(categorize_temperature)
        )


        # ==========================================
        # 4. Display result
        # ==========================================

        print("===== FEATURE ENGINEERING =====")

        print(df.head())

        print("\nColumns:")
        print(df.columns)

        print("\nData types:")
        print(df.dtypes)


        # ==========================================
        # 5. Save feature dataset
        # ==========================================

        output_file = Path(
            FEATURES_FILE
        )

        output_file.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        df.to_csv(
            FEATURES_FILE, 
            index=False
        )

        logger.info(f"Feature dataset saved to: {output_file}")
        
        print(
            f"\nFeature dataset saved to: {FEATURES_FILE}"
        )

        return df

    except FileNotFoundError as e:

        logger.error(
            f"Input file not found: {e}"
        )
        raise

    except KeyError as e: 

        logger.error(
            f"Missing required column: {e}"
        )
        raise

    except Exception as e: 

        logger.error(
            f"Feature engineering failed: {e}"
        )
        raise
    
if __name__ == "__main__":
    engineer_features()