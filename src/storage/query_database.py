import sqlite3
from pathlib import Path


# ==========================================
# 1. Database path
# ==========================================

DB_PATH = Path("database/weather.db")


# ==========================================
# 2. Connect database
# ==========================================

connection = sqlite3.connect(DB_PATH)

print("Database connected successfully")


# ==========================================
# 3. Basic statistics
# ==========================================

cursor = connection.execute("""
SELECT 
    COUNT(*) AS total_records,
    AVG(temperature) AS avg_temperature,
    MAX(temperature) AS max_temperature,
    MIN(temperature) AS min_temperature,
    AVG(humidity) AS avg_humidity
FROM weather_data
""")

stats = cursor.fetchone()

print("\n===== WEATHER STATISTICS =====")

print("Total records:",stats[0])
print("Average temperature:", stats[1])
print("Maximum temperature:", stats[2])
print("Minimum temperature:", stats[3])
print("Average humidity:", stats[4])


# ==========================================
# 4. Hottest hour
# ==========================================

cursor = connection.execute("""
SELECT
    time,
    temperature
FROM weather_data
ORDER BY temperature DESC
LIMIT 1
""")

hottest = cursor.fetchone()

print("\n===== HOTTEST HOUR =====")

print("Time:", hottest[0])
print("temperature:", hottest[1])


# ==========================================
# 5. Rainiest hour
# ==========================================

cursor = connection.execute("""
SELECT
    time,
    precipitation
FROM weather_data
ORDER BY precipitation DESC
LIMIT 1
""")

rainiest = cursor.fetchone()

print("\n===== RAINIEST HOUR =====")

print("Time:", rainiest[0])
print("Precipitation:", rainiest[1])


# ==========================================
# 6. Daily temperature
# ==========================================

cursor = connection.execute("""
SELECT
    substr(time, 1, 10) AS date,
    AVG(temperature) AS avg_temperature
FROM weather_data
GROUP BY substr(time, 1, 10)
ORDER BY date
""")

print("\n===== DAILY TEMPERATURE =====")

for row in cursor.fetchall():
    print(row)


# ==========================================
# 7. Daily weather summary
# ==========================================

cursor = connection.execute("""
SELECT
    substr(time, 1, 10) AS date,
    AVG(temperature) AS avg_temperature,
    MAX(temperature) AS max_temperature,
    MIN(temperature) AS min_temperature,
    AVG(humidity) AS avg_humidity,
    MAX(wind_speed) AS max_wind_speed,
    SUM(precipitation) AS total_precipitation
FROM weather_data
GROUP BY substr(time, 1, 10)
ORDER BY date
""")

print("\n===== DAILY WEATHER SUMMARY =====")

for row in cursor.fetchall():
    print(row)


# ==========================================
# 8. Hot and rainy days
# ==========================================

cursor = connection.execute("""
SELECT
    substr(time, 1, 10) AS date,
    AVG(temperature) AS avg_temperature, 
    SUM(precipitation) AS total_rain
FROM weather_data
GROUP BY substr(time, 1, 10)
HAVING AVG(temperature) > 27
AND SUM(precipitation) > 5
ORDER BY date
""")

print("\n===== HOT AND RAINY DAYS =====")

for row in cursor.fetchall():
    print(row)

# ==========================================
# 9. Close connection
# ==========================================

connection.close()

print("\nDatabase connection closed")