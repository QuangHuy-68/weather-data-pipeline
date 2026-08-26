import pandas as pd 
import logging
import matplotlib.pyplot as plt
from pathlib import Path

from config.config import DAILY_SUMMARY_FILE

logger = logging.getLogger(__name__)

def create_daily_dashboard():

    try: 
        # ==========================================
        # 1. Load daily dataset
        # ==========================================

        df = pd.read_csv(DAILY_SUMMARY_FILE)

        df["date"] = pd.to_datetime(
            df["date"]
        )

        logger.info(f"Loaded daily dataset: {DAILY_SUMMARY_FILE}")

        logger.info(f"Daily dataset rows: {len(df)}")

        print("===== DAILY DATA =====")

        print(df)


        # ==========================================
        # 2. Create chart directory
        # ==========================================

        chart_dir = Path(
            "reports/charts"
        )

        chart_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        logger.info(f"Chart directory ready: {chart_dir}")

        # ==========================================
        # 3. Temperature chart
        # ==========================================

        plt.figure(figsize=(12,6))

        plt.plot(
            df["date"],
            df["avg_temperature"],
            marker="o",
            label="Average"
        )

        plt.plot(
            df["date"],
            df["max_temperature"],
            marker="o",
            label="Maximum"
        )

        plt.plot(
            df["date"],
            df["min_temperature"],
            marker="o",
            label="Minimum"
        )

        plt.xlabel("Date")

        plt.ylabel("Temperature (°C)")

        plt.title("Daily Temperature")

        plt.legend()

        plt.xticks(rotation=45)

        plt.tight_layout()

        temperature_chart = ( chart_dir / "daily_temperature.png" )

        plt.savefig(
            temperature_chart
        )

        plt.close()

        logger.info(f"Temperature chart saved: {temperature_chart}")


        # ==========================================
        # 4. Humidity chart
        # ==========================================

        plt.figure(figsize=(12, 5))

        plt.plot(
            df["date"],
            df["avg_humidity"],
            marker="o"
        )

        plt.xlabel("Date")

        plt.ylabel("Humidity (%)")

        plt.title(
            "Average Daily Humidity"
        )

        plt.xticks(rotation=45)

        plt.tight_layout()

        humidity_chart = ( chart_dir / "daily_humidity.png" )

        plt.savefig(
            humidity_chart
        )

        plt.close()

        logger.info(f"Humidity chart saved: {humidity_chart}")

        # ==========================================
        # 5. Precipitation chart
        # ==========================================

        plt.figure(figsize=(12, 5))

        plt.bar(
            df["date"],
            df["total_precipitation"]
        )

        plt.xlabel("Date")

        plt.ylabel("precipitation")

        plt.title("Daily Precipitation")

        plt.xticks(rotation=45)

        plt.tight_layout()

        precipitation_chart = ( chart_dir / "daily_precipitation.png" )

        plt.savefig(
            precipitation_chart
        )

        plt.close()

        logger.info(
            f"Precipitation chart saved: "
            f"{precipitation_chart}"
        )

        print(
            "\nCharts saved to:",
            chart_dir
        )

        logger.info(
            f"Dashboard charts created successfully: "
            f"{chart_dir}"
        )

        return chart_dir

    except FileNotFoundError as e:

        logger.error(
            f"Daily summary file not found: {e}"
        )

        raise

    except Exception as e: 

        logger.error(
            f"Dashboard creation failed: {e}"
        )

        raise

if __name__ == "__main__":
    create_daily_dashboard()