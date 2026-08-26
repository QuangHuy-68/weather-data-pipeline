import sqlite3
import json
import logging
from pathlib import Path

from config.config import RAW_DATA_DIR

logger = logging.getLogger(__name__)

def store_to_database():

    # ==========================================
    # 1. Database path
    # ==========================================

    DB_PATH = Path("database/weather.db")


    # ==========================================
    # 2. Raw data path
    # ==========================================

    raw_data_dir = Path(RAW_DATA_DIR)


    # ==========================================
    # 3. Create database directory
    # ==========================================

    DB_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )


    # ==========================================
    # 4. Connect database
    # ==========================================
    try:

        connection = sqlite3.connect(DB_PATH)

        print("Database connected successfully")


        # ==========================================
        # 5. Create location table
        # ==========================================

        connection.execute("""
        CREATE TABLE IF NOT EXISTS weather_location (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_name TEXT UNIQUE,
            latitude REAL,
            longitude REAL
        )
        """)

        connection.commit()
        print("Table weather_location created successfully.")


        # ==========================================
        # 6. Insert location
        # ==========================================

        connection.execute("""
        INSERT OR IGNORE INTO weather_location (
            location_name,
            latitude,
            longitude
        )
        VALUES (?, ?, ?)
        """, (
            "Ho Chi Minh City",
            10.8231,
            106.6297
        ))

        connection.commit()

        print("Location inserted successfully.")


        # ==========================================
        # 7. Create weather table
        # ==========================================

        connection.execute("""
        CREATE TABLE IF NOT EXISTS weather_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            time TEXT UNIQUE,
            location_id INTEGER,
            temperature REAL,
            humidity REAL,
            wind_speed REAL,
            precipitation REAL,
            FOREIGN KEY (location_id)
                REFERENCES weather_location(id)
        )
        """)

        connection.commit()

        print("Table weather_data created successfully.")


        # ==========================================
        # 8. Find latest raw JSON file
        # ==========================================
        json_files = list(raw_data_dir.glob("weather_*.json"))

        if not json_files:
            raise FileNotFoundError(
                "No weather JSON file found in data/raw"
            )


        latest_file = max(
            json_files,
            key=lambda file: file.stat().st_mtime
        )

        print(f"Reading raw data: {latest_file}")


        # ==========================================
        # 9. Read JSON
        # ==========================================

        with open(
            latest_file,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)


        # ==========================================
        # 10. Extract hourly data
        # ==========================================

        hourly = data["hourly"]

        times = hourly["time"]
        temperatures = hourly["temperature_2m"]
        humidities = hourly["relative_humidity_2m"]
        wind_speeds = hourly["wind_speed_10m"]
        precipitations = hourly["precipitation"]


        # ==========================================
        # 11. Prepare rows
        # ==========================================

        rows = []

        for i in range(len(times)): 

            rows.append((
                times[i],
                1, # location_id
                temperatures[i],
                humidities[i],
                wind_speeds[i],
                precipitations[i]
            ))


        # ==========================================
        # 12. Insert weather data
        # ==========================================

        connection.executemany("""
        INSERT OR IGNORE INTO weather_data (
            time,
            location_id,
            temperature,
            humidity,
            wind_speed,
            precipitation
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """, rows)

        connection.commit()

        print(f"Inserted {len(rows)} weather records")


        # ==========================================
        # 13. Check weather data
        # ==========================================

        cursor = connection.execute("""
        SELECT 
            id, 
            time,
            location_id,
            temperature,
            humidity,
            wind_speed,
            precipitation
        FROM weather_data
        LIMIT 5
        """)

        print("\n===== WEATHER DATA =====")

        for row in cursor.fetchall():
            print(row)


        # ==========================================
        # 14. Test JOIN
        # ==========================================

        cursor = connection.execute("""
        SELECT
            weather_data.time,
            weather_data.temperature,
            weather_location.location_name
        FROM weather_data
        JOIN weather_location
            ON weather_data.location_id = weather_location.id
        LIMIT 5
        """)

        print("\n===== WEATHER WITH LOCATION =====")

        for row in cursor.fetchall():
            print(row)


        # ==========================================
        # 15. Close connection
        # ==========================================

        connection.close()

        print("Database connection closed")

    except sqlite3.Error as e: 
        logger.error(f"Database error: {e}")
        raise

    except FileNotFoundError as e: 
        logger.error(f"Raw data not found: {e}")
        raise

    finally:
        if connection:
            connection.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    store_to_database()