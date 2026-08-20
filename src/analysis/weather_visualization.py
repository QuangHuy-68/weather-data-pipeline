import pandas as pd 
import matplotlib.pyplot as plt

# ==========================================
# 1. Load final dataset
# ==========================================

df = pd.read_csv(
    "data/process/weather_final.csv"
)

df["time"] = pd.to_datetime(df["time"])

print("Dataset shape:", df.shape)


# ==========================================
# 2. Temperature over time
# ==========================================

plt.figure(figsize=(12,5))

plt.plot(
    df["time"],
    df["temperature"],
    marker="o"
)

plt.xlabel("Time")
plt.ylabel("Temperature (°C)")
plt.title("Temperature Over Time")

plt.xticks(rotation=45)

plt.tight_layout()

plt.show()


# ==========================================
# 3. Humidity over time
# ==========================================

plt.figure(figsize=(12,5))

plt.plot(
    df["time"], 
    df["humidity"],
    marker="o"
)

plt.xlabel("Time")
plt.ylabel("Humidity (%)")
plt.title("Humidity Over Time")

plt.xticks(rotation=45)

plt.tight_layout

plt.show()


# ==========================================
# 4. Precipitation
# ==========================================

plt.figure(figsize=(12, 5))

plt.bar(
    df["time"],
    df["precipitation"]
)

plt.xlabel("Time")
plt.ylabel("Precipitation (mm)")
plt.title("Precipitation Over Time")

plt.xticks(rotation=45)

plt.tight_layout()

plt.show()


# ==========================================
# 5. Temperature by hour
# ==========================================

hourly_temperature = (
    df.groupby("hour")["temperature"]
    .mean()
)

plt.figure(figsize=(10, 5))

plt.plot(
    hourly_temperature.index,
    hourly_temperature.values,
    marker="o"
)

plt.xlabel("Hour of Day")
plt.ylabel("Average Temperature (°C)")
plt.title("Average Temperature by Hour")

plt.xticks(range(24))

plt.grid(True)

plt.tight_layout()

plt.show()


# ==========================================
# 6. Humidity by hour
# ==========================================

hourly_humidity = (
    df.groupby("hour")["humidity"]
    .mean()
)

plt.figure(figsize=(10, 5))

plt.plot(
    hourly_humidity.index,
    hourly_humidity.values,
    marker="o"
)

plt.xlabel("Hour of Day")
plt.ylabel("Average Humidity (%)")
plt.title("Average Humidity by Hour")

plt.xticks(range(24))

plt.grid(True)

plt.tight_layout()

plt.show()


# ==========================================
# 7. Temperature distribution
# ==========================================

plt.figure(figsize=(10, 5))

plt.hist(
    df["temperature"],
    bins=10
)

plt.xlabel("Temperature (°C)")
plt.ylabel("Frequency")
plt.title("Temperature Distribution")

plt.tight_layout()

plt.show()


# ==========================================
# 8. Wind speed distribution
# ==========================================

plt.figure(figsize=(10, 5))

plt.hist(
    df["wind_speed"],
    bins=10
)

plt.xlabel("Wind speed")
plt.ylabel("Frequency")
plt.title("Wind Speed Distribution")

plt.tight_layout()

plt.show()


# ==========================================
# 9. Temperature vs Humidity
# ==========================================

plt.figure(figsize=(8, 5))

plt.scatter(
    df["temperature"],
    df["humidity"]
)

plt.xlabel("Temperature (°C)")
plt.ylabel("Humidity (%)")
plt.title("Temperature vs Humidity")

plt.tight_layout()

plt.show()


# ==========================================
# 10. Rainy vs Non-Rainy
# ==========================================

rain_counts = (
    df["is_rainy"]
    .value_counts()
)

print("\nRain counts:")

print(rain_counts)

plt.figure(figsize=(6, 5))

plt.bar(
    ["No Rain", "Rain"],
    [
        rain_counts.get(False, 0),
        rain_counts.get(True, 0)
    ]
)

plt.xlabel("Weather Condition")
plt.ylabel("Number of Hours")
plt.title("Rainy vs Non-Rainy Hours")

plt.tight_layout()

plt.show()