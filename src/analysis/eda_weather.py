import pandas as pd
import matplotlib.pyplot as plt

# ==========================================
# 1. Load processed data
# ==========================================
df = pd.read_csv(
    "data/process/weather_cleaned.csv"
)

df["time"] = pd.to_datetime(df["time"])

# ==========================================
# 2. Basic information
# ==========================================
print("===== DATASET INFO =====")

print("Shape:", df.shape)

print("\nColumns:")
print(df.columns)

print("\nData types:")
print(df.dtypes)

print("\nMissing values:")
print(df.isnull().sum())

# ==========================================
# 3. Statistics
# ==========================================
print("\n===== STATISTICS =====")
print(
    df[
        [
            "temperature",
            "humidity",
            "wind_speed",
            "precipitation"
        ]
    ].describe()
)

# ==========================================
# 4. Temperature analysis
# ==========================================
print("\n===== TEMPERATURE =====")

print(
    "Average:",
    df["temperature"].mean()
)

print(
    "Minimum:",
    df["temperature"].min()
)

print(
    "Maximum",
    df["temperature"].max()
)

max_temp_row = df.loc[
    df["temperature"].idxmax()
]

print("\nHottest time:")
print(max_temp_row)

min_temp_row = df.loc[
    df["temperature"].idxmin()
]

print("\nColdest time:")
print(min_temp_row)

# ==========================================
# 5. Humidity analysis
# ==========================================

print("\n===== HUMIDITY =====")

print(
    "Average humidity:",
    df["humidity"].mean()
)

print(
    "Minimum humidity:",
    df["humidity"].min()
)

print(
    "Maximum humidity:",
    df["humidity"].max()
)

# ==========================================
# 6. Wind analysis
# ==========================================
print("\n===== WIND =====")

print(
    "Maximum wind:",
    df["wind_speed"].max()
)

# ==========================================
# 7. Rain analysis
# ==========================================
print("\n===== RAIN =====")

print(
    "Total precipitation:",
    df["precipitation"].sum()
)

rainy_hours = df[
    df["precipitation"] > 0
]

print(
    "Rainy hours:",
    len(rainy_hours)
)

# ==========================================
# 8. Temperature chart
# ==========================================
plt.plot(
    df["time"],
    df["temperature"]
)

plt.xlabel("Time")
plt.ylabel("Temperature (°C)")
plt.title("Temperature Over Time")

plt.xticks(rotation=45)
plt.tight_layout

plt.show()


# ==========================================
# 9. Humidity chart
# ==========================================
plt.figure(figsize=(12,5))

plt.plot(
    df["time"],
    df["humidity"]
)

plt.xlabel("Time")
plt.ylabel("Humidity (%)")
plt.title("Humidity Over Time")

plt.xticks(rotation=45)

plt.tight_layout()

plt.show()


# ==========================================
# 10. Precipitation chart
# ==========================================
plt.figure(figsize=(12,5))

plt.bar(
    df["time"],
    df["precipitation"],
    width=0.03
)

plt.xlabel("Time")
plt.ylabel("Precipitation (mm)")
plt.title("Precipitation Over Time")

plt.xticks(rotation=45)

plt.tight_layout()

plt.show()


# ==========================================
# 11. Temperature vs Humidity
# ==========================================
plt.figure(figsize=(8,5))

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
# 12. Correlation
# ==========================================
correlation_matrix = df[
    [
        "temperature",
        "humidity",
        "wind_speed",
        "precipitation"
    ]
].corr()

print("\n===== CORRELATION MATTRIX =====")

print(correlation_matrix)