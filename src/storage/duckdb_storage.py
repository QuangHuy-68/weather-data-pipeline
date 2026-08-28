import logging
import pandas as pd 
import duckdb
from pathlib import Path
from config.config import (
    FINAL_DATA_FILE,
    PARQUET_DATA_DIR,
    PARQUET_FILE,
    DUCKDB_PATH
)

logger = logging.getLogger(__name__)

def export_to_parquet_and_duckdb() -> None:
    if not Path(FINAL_DATA_FILE).exists():
        logger.error(f"{FINAL_DATA_FILE} not found to load into DuckDB!")
        return 

    print("\n🦆 SAVING DATA TO DUCKDB & PARQUET...")


    df = pd.read_csv(FINAL_DATA_FILE)
    df["time"] = pd.to_datetime(df["time"])

    Path(PARQUET_DATA_DIR).mkdir(parents=True, exist_ok=True)
    df.to_parquet(PARQUET_FILE, engine="pyarrow", index=False, compression="snappy")
    print(f"📦 Saved Parquet to: {PARQUET_FILE}")

    Path(DUCKDB_PATH).parent.mkdir(parents=True, exist_ok=True)

    with duckdb.connect(DUCKDB_PATH) as con: 

        con.execute(f"""
            CREATE OR REPLACE TABLE weather_analytics AS
            SELECT * FROM read_parquet('{PARQUET_FILE}')
            """)

        count = con.execute("SELECT COUNT(*) FROM weather_analytics").fetchone()[0]
        print(f"✅ Successfully loaded {count} records into DuckDB OLAP ({DUCKDB_PATH})")
        logger.info(f"Saved {count} rows to DuckDB and Parquet.")

if __name__ == "__main__": 
    export_to_parquet_and_duckdb()