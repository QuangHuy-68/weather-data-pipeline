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
print(df.describe())

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
# 5. Wind analysis
# ==========================================
print("\n===== WIND =====")

print(
    "Maximum wind:",
    df["wind_speed"].max()
)

# ==========================================
# 6. Rain analysis
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
# 7. Temperature chart
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
