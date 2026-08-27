import os
import subprocess 
import logging
import argparse
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
        "Feature Engineering",
        "src/transformation/feature_engineering.py"
    ),

    (
        "Prepare Final Dataset",
        "src/transformation/prepare_final_dataset.py"
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
    ),

    (
        "Database Storage",
        "src/storage/database.py"
    )
]

# ==========================================
# Shortcut names for CLI
# ==========================================
STEP_NAMES = {
    "api":          ("Weather API", "src/ingestion/weather_api.py"),
    "transform":    ("Data Transformation", "src/transformation/transform_weather.py"),
    "validate":     ("Data Validation", "src/validation/validate_weather.py"),
    "features":     ("Feature Engineering", "src/transformation/feature_engineering.py"),
    "final":        ("Prepare Final Dataset", "src/transformation/prepare_final_dataset.py"),
    "advanced":     ("Advanced Features", "src/transformation/advanced_features.py"),
    "summary":      ("Daily Summary", "src/analysis/daily_summary.py"),
    "dashboard":    ("Daily Dashboard", "src/analysis/daily_dashboard.py"),
    "database":     ("Database Storage", "src/storage/database.py")
}

DEFAULT_ORDER = [
    "api",
    "transform",
    "validate",
    "features",
    "final",
    "advanced",
    "summary",
    "dashboard",
    "database"
]

def parse_args():
    """Parse command line arguments."""

    parser = argparse.ArgumentParser(description="🌦️ Weather Data Pipeline")
    parser.add_argument(
        "--steps", 
        type=str,
        default=None,
        help="Run the specific steps (separated by commas)." "Example: --steps api, transform, validate"
    )

    parser.add_argument(
        "--list-steps",
        action="store_true",
        help="List all steps which can run"
    )

    return parser.parse_args()
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

    args = parse_args()
    # --list-steps:
    if args.list_steps:
        print("Available steps:")
        for key, (name, _) in STEP_NAMES.items():
            print(f" {key:12s} -> {name}")

        return

    # --steps:
    if args.steps:
        selected = [s.strip() for s in args.steps.split(",")]
        for s in selected:
            if s not in STEP_NAMES:
                print(f"❌ Unknown step: '{s}'")
                print("Use --list-steps to see available steps.")
                return

    else: 
        selected = DEFAULT_ORDER
    
    # Run Pipeline
    print("\n🌦️ WEATHER DATA PIPELINE STARTED")

    logger.info(
        "Weather Data Pipeline started"
    )

    for step_key in selected:
        name, script = STEP_NAMES[step_key]
        run_step(name, script)
  
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