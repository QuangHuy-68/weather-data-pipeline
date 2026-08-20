import pandas as pd 
import matplotlib.pyplot as plt

# ==========================================
# 1. Load feature dataset
# ==========================================

df = pd.read_csv(
    "data/process/weather_features.csv"
)

df["time"] = pd.to_datetime(df["time"])


# ==========================================
# 2. Average temperature by hour
# ==========================================

hourly_temperature = (
    df.groupby("hour")["temperature"]
    .mean()
)

print("\n===== AVERAGE TEMPERATURE BY HOUR =====")
print(hourly_temperature)

# ==========================================
# 3. Hottest hour
# ==========================================

hottest_hour = (
    hourly_temperature.idxmax()
)

hottest_temperature = (
    hourly_temperature.max()
)

print("\nHottest hour:", hottest_hour)

print("Average temperature:", hottest_temperature)


# ==========================================
# 4. Average humidity by hour
# ==========================================

hourly_humidity = (
    df.groupby("hour")["humidity"]
    .mean()
)

print("\n===== AVERAGE HUMIDITY BY HOUR =====")
print(hourly_humidity)

highest_humidity_hour = (
    hourly_humidity.idxmax()
)

print(
    "\nHighest humidity hour:",
    highest_humidity_hour
)

# ==========================================
# 5. Rain analysis by hour
# ==========================================

hourly_total_rain = (
    df.groupby("hour")["precipitation"]
    .sum()
)

print("\n===== TOTAL RAIN BY HOUR =====")

print(hourly_total_rain)

rainiest_hour = (
    hourly_total_rain.idxmax()
)

print(
    "\nRainiest hour:", 
    rainiest_hour
)


# ==========================================
# 6. Rain occurrences by hour
# ==========================================
rainy_by_hour = (
    df.groupby("hour")["is_rainy"]
    .sum()
)

most_rainy_hour = (
    rainy_by_hour.idxmax()
)

print(
    "\nMost rainy hour:", 
    most_rainy_hour
)


# ==========================================
# 7. Temperature visualization
# ==========================================

plt.figure(figsize=(10,5))

plt.plot(
    hourly_temperature.index,
    hourly_temperature.values,
    marker="o"
)

plt.xlabel("Hour of Day")
plt.ylabel("Average Temperature (°C)")
plt.title("Average Temperature by Hour")

plt.xticks(range(24))

plt.tight_layout()

plt.show()