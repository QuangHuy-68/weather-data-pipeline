import pandas as pd

# ==========================================
# 1. Load final dataset
# ==========================================

df = pd.read_csv(
    "data/process/weather_final.csv"
)

df["time"] = pd.to_datetime(df["time"])

print("Original columns:")
print(df.columns.tolist())


# ==========================================
# 2. Temperature-Humidity Index
# ==========================================

df["temp_humidity_index"] = (
    df["temperature"]
    + 0.1 * df["humidity"]
)


# ==========================================
# 3. Wind Category
# ==========================================

def classify_wind(speed):

    if speed < 10: 
        return "Low"

    elif speed < 20: 
        return "Moderate"

    else: 
        return "High"

df["wind_category"] = (
    df["wind_speed"]
    .apply(classify_wind)
)


# ==========================================
# 4. Rain Intensity
# ==========================================

def classify_rain(rain):

    if rain == 0:
        return "No Rain"

    elif rain < 2.5:
        return "Light"

    elif rain < 10: 
        return "Moderate"

    else: 
        return "Heavy"

df["rain_intensity"] = (
    df["precipitation"]
    .apply(classify_rain)
)


# ==========================================
# 5. Is Hot
# ==========================================

df["is_hot"] = (
    df["temperature"] >= 32
)


# ==========================================
# 6. Show new features
# ==========================================

print("\n===== NEW FEATURES =====")

print(
    df[
        [
            "temperature",
            "humidity",
            "wind_speed",
            "precipitation", 
            "temp_humidity_index",
            "wind_category",
            "rain_intensity",
            "is_hot"
        ]
    ].head(10)
)


# ==========================================
# 7. Hot hours
# ==========================================

hot_hours = (
    df["is_hot"]
    .sum()
)

print(
    "\nHot hours:",
    hot_hours
)


# ==========================================
# 8. Wind category
# ==========================================

print("\n===== WIND CATEGORY =====")

print(
    df["wind_category"]
    .value_counts()
)


# ==========================================
# 9. Rain intensity
# ==========================================

print("\n===== RAIN INTENSITY =====")

print(
    df["rain_intensity"]
    .value_counts()
)


# ==========================================
# 10. Save
# ==========================================

output_file = (
    "data/process/weather_features_v2.csv"
)

df.to_csv(
    output_file,
    index=False
)

print(
    f"\nFeature dataset saved to: {output_file}"
)