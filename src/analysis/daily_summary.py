import pandas as pd
import logging

from config.config import FEATURES_V2_FILE, DAILY_SUMMARY_FILE

logger = logging.getLogger(__name__)

def create_daily_summary():

    try:

        # ==========================================
        # 1. Load feature dataset
        # ==========================================

        df = pd.read_csv(FEATURES_V2_FILE)

        df["time"] = pd.to_datetime(df["time"], errors="coerce")

        logger.info(f"Loaded feature dataset: {FEATURES_V2_FILE}")

        logger.info(f"Original rows: {len(df)}")

        print("Original rows:", len(df))


        # ==========================================
        # 2. Create date
        # ==========================================

        df["date"] = df["time"].dt.date

        logger.info("Created date column")

        # ==========================================
        # 3. Daily aggregation
        # ==========================================

        daily_summary = (
            df.groupby("date")
            .agg(
                avg_temperature=("temperature", "mean"),
                max_temperature=("temperature", "max"),
                min_temperature=("temperature", "min"),
                avg_humidity=("humidity", "mean"),
                max_wind_speed=("wind_speed", "max"),
                total_precipitation=("precipitation", "sum")
            )
            .reset_index()
        )

        logger.info(f"Created daily summary: {len(daily_summary)} days")

        # ==========================================
        # 4. Display summary
        # ==========================================

        print("\n===== DAILY WEATHER SUMMARY =====")

        print(daily_summary)


        # ==========================================
        # 5. Hottest day
        # ==========================================

        hottest_day = daily_summary.loc[
            daily_summary["max_temperature"].idxmax()
        ]

        print("\n===== HOTTEST DAY =====")

        print(hottest_day)

        logger.info(
            f"Hottest day: {hottest_day['date']} "
            f"with {hottest_day['max_temperature']} °C"
        )

        # ==========================================
        # 6. Rainiest day
        # ==========================================

        rainiest_day = daily_summary.loc[
            daily_summary["total_precipitation"].idxmax()
        ]

        print("\n===== RAINIEST DAY =====")

        print(rainiest_day)

        logger.info(
            f"Rainiest day: {rainiest_day['date']} "
            f"with {rainiest_day['total_precipitation']} mm"
        )
        # ==========================================
        # 7. Rainy days
        # ==========================================

        rainy_days = daily_summary[
            daily_summary["total_precipitation"] > 0
        ]

        print(
            "\nRainy days:",
            len(rainy_days)
        )

        logger.info(
            f"Rainy days: {len(rainy_days)}"
        )

        # ==========================================
        # 8. Save daily summary
        # ==========================================

        daily_summary.to_csv(
            DAILY_SUMMARY_FILE,
            index=False
        )

        print(
            f"\nDaily summary saved to: {DAILY_SUMMARY_FILE}"
        )

        logger.info(
            f"Daily summary saved to: "
            f"{DAILY_SUMMARY_FILE}"
        )

        return daily_summary

    except FileNotFoundError as e: 
        logger.error(f"Daily summary input file not found: {e}")
        raise

    except Exception as e: 
        logger.error(f"Daily summary failed: {e}")
        raise

if __name__ == "__main__":
    create_daily_summary()