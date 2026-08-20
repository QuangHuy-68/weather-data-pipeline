import sqlite3
import json
from pathlib import Path


# ==========================================
# 1. Database path
# ==========================================

DB_PATH = Path("database/weather.db")


# ==========================================
# 2. Raw data path
# ==========================================

RAW_DATA_DIR = Path("data/raw")


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

connection = sqlite3.connect(DB_PATH)

print("Database conncected successfully")


# ==========================================
# 5. Create table
# ==========================================

connection.execute("""
CREATE TABLE IF NOT EXISTS weather_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time TEXT,
    temperature REAL,
    humidity REAL,
    wind_speed REAL,
    precipitation REAL
)
""")

connection.commit()
print("Table weather_data created successfully")


# ==========================================
# 6. Find latest raw JSON file
# ==========================================
json_files = list(RAW_DATA_DIR.glob("weather_*.json"))

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
# 7. Read JSON
# ==========================================

with open(
    latest_file,
    "r",
    encoding="utf-8"
) as file:

    data = json.load(file)


# ==========================================
# 8. Extract hourly data
# ==========================================

hourly = data["hourly"]

times = hourly["time"]
temperatures = hourly["temperature_2m"]
humidities = hourly["relative_humidity_2m"]
wind_speeds = hourly["wind_speed_10m"]
precipitations = hourly["precipitation"]


# ==========================================
# 9. Insert data
# ==========================================

rows = []

for i in range(len(times)): 

    rows.append((
        times[i],
        temperatures[i],
        humidities[i],
        wind_speeds[i],
        precipitations[i]
    ))

connection.executemany("""
INSERT INTO weather_data (
    time,
    temperature,
    humidity,
    wind_speed,
    precipitation
)
VALUES (?, ?, ?, ?, ?)
""", rows)

connection.commit()

print(f"Inserted {len(rows)} weather records")


# ==========================================
# 10. Check data
# ==========================================

cursor = connection.execute("""
SELECT *
FROM weather_data
LIMIT 5
""")

for row in cursor.fetchall():
    print(row)


# ==========================================
# 11. Close connection
# ==========================================

connection.close()

print("Database connection closed")