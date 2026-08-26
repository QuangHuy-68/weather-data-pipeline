import pandas as pd 
import logging

from pathlib import Path

from config.config import FEATURES_FILE, FINAL_DATA_FILE

logger = logging.getLogger(__name__)

def prepare_final_dataset():

    try:
        # ==========================================
        # 1. Load feature dataset
        # ==========================================

        df = pd.read_csv(FEATURES_FILE)

        logger.info(f"Loaded feature dataset: {len(df)} rows")

        df["time"] = pd.to_datetime(df["time"])

        print("Original rows:", len(df))


        # ==========================================
        # 2. Domain validation
        # ==========================================

        invalid_humidity = df[
            (df["humidity"] < 0)
            |
            (df["humidity"] > 100)
        ]

        invalid_wind = df[
            df["wind_speed"] < 0
        ]

        invalid_precipitation = df[
            df["precipitation"] < 0
        ]


        # ==========================================
        # 3. Collect invalid rows
        # ==========================================

        invalid_indexes = set(
            invalid_humidity.index
        )

        invalid_indexes.update(
            invalid_wind.index
        )

        invalid_indexes.update(
            invalid_precipitation.index
        )


        logger.info(
            f"Invalid records found: {len(invalid_indexes)}"
        )

        # ==========================================
        # 4. Remove invalid records
        # ==========================================

        df_final = df.drop(
            index=invalid_indexes
        )

        # ==========================================
        # 5. Remove duplicates
        # ==========================================

        duplicate_count = (
            df_final.duplicated().sum()
        )

        df_final = (
            df_final
            .drop_duplicates()
        )

        if duplicate_count > 0:

            logger.warning(f"Removed {duplicate_count} duplicate rows")


        # ==========================================
        # 6. Quality check
        # ==========================================

        print(
            "\nRemoved invalid rows:",
            len(df) - len(df_final)
        )

        print(
            "Duplicate rows found:",
            duplicate_count
        )

        print(
            "Final rows:",
            len(df_final)
        )

        print("\nMissing values:")

        print(df_final.isnull().sum())


        # ==========================================
        # 7. Save final dataset
        # ==========================================

        output_file = Path(
            FINAL_DATA_FILE
        )

        output_file.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        df_final.to_csv(
            FINAL_DATA_FILE,
            index=False
        )

        logger.info(
            f"Final dataset saved to: {output_file}"
        )

        print(
            f"\nFinal dataset saved to: {FINAL_DATA_FILE}"
        )

        return df_final

    except FileNotFoundError as e:

        logger.error(
            f"Feature dataset not found: {e}"
        )
        raise

    except KeyError as e:

        logger.error(
            f"Missing required column: {e}"
        )
        raise

    except Exception as e:

        logger.error(
            f"Final dataset preparation failed: {e}"
        )
        raise

if __name__ == "__main__":
    prepare_final_dataset()