import os
import subprocess 
import logging
from pathlib import Path

# ==========================================
# 1. Logging configuration
# ==========================================

log_dir = Path("logs")

log_dir.mkdir(
    parents=True,
    exist_ok=True
)

logging.basicConfig(
    filename=log_dir / "pipeline.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


# ==========================================
# 2. Pipeline steps
# ==========================================

pipeline_steps = [

    (
        "Weather API",
        "src/ingestion/weather_api.py"
    ),

    (
        "Data Transformation",
        "src/transformation/transform_weather.py"
    ),

    (
        "Data Validation",
        "src/validation/validate_weather.py"
    ),

    (
        "Advanced Feature Engineering", 
        "src/transformation/advanced_features.py"
    ),

    (
        "Daily Summary",
        "src/analysis/daily_summary.py"
    ),

    (
        "Daily Dashboard",
        "src/analysis/daily_dashboard.py"
    )
]


# ==========================================
# 3. Run one pipeline step
# ==========================================

def run_step(name, script): 

    print("\n" + "=" * 50)
    print(f"RUNNING: {name}")
    print("=" * 50)

    logger.info(
        f"Starting step: {name}"
    )

    try:

        env = os.environ.copy()

        env["PYTHONPATH"] = str(Path.cwd())

        subprocess.run(
            ["Python", script],
            check=True,
            env=env
        )

        logger.info(
            f"Completed step: {name}"
        )
        
    except subprocess.CalledProcessError:
        logger.error(
            f"Step failed: {name}"
        )   

        raise


# ==========================================
# 4. Main pipeline
# ==========================================

def main():

    print("\n🌦️ WEATHER DATA PIPELINE STARTED")

    logger.info(
        "Weather Data Pipeline started"
    )

    for name, script in pipeline_steps:

        run_step(
            name,
            script
        )
    print("\n" + "=" * 50)

    print("✅ WEATHER DATA PIPELINE COMPLETED")

    print("=" * 50)

    logger.info(
        "Weather Data Pipeline completed successfully"
    )


# ==========================================
# 5. Entry point
# ==========================================

if __name__ == "__main__":
    main()