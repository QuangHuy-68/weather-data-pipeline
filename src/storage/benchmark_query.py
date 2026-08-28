import time
import sqlite3
import duckdb
import sys

from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from config.config import DB_PATH, DUCKDB_PATH, PARQUET_FILE


def run_benchmark(): 

    print("\n⚡ STARTING DATA QUERY BENCHMARK:")

    start_sqlite = time.perf_counter()
    with sqlite3.connect(DB_PATH) as conn:

        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                AVG(temperature) as avg_temp,
                MAX(temperature) as max_temp,
                MIN(temperature) as min_temp,
                SUM(precipitation) as total_rain
                
            FROM weather_data
        """)

        res_sqlite = cursor.fetchone()
    time_sqlite = (time.perf_counter() - start_sqlite) * 1000

    start_duckdb = time.perf_counter()
    with duckdb.connect(DUCKDB_PATH) as conn: 
        res_duckdb = conn.execute("""
            SELECT
                AVG(temperature) as avg_temp, 
                MAX(temperature) as max_temp,
                MIN(temperature) as min_temp,
                SUM(precipitation) as total_rain

            FROM weather_analytics    
        """)

        res_duck = res_duckdb.fetchone()
    
    time_duckdb = (time.perf_counter() - start_duckdb) * 1000

    print("-" * 50)
    print(f"🗄️  SQLite Query Time: {time_sqlite:.3f} ms") 
    print(f"🦆 DuckDB Query Time: {time_duckdb:.3f} ms")
    print(f"🚀 Statistics: Avg. Temp = {res_duck[0]:.2f}°C, Rainfall = {res_duck[3]:.1f}mm")
    print("-" * 50)

if __name__ == "__main__":
    run_benchmark()