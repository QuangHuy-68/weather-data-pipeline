import pandas as pd

# ==========================================
# 1. Load cleaned data
# ==========================================

df = pd.read_csv(
    "data/process/weather_cleaned.csv"
)

df["time"] = pd.to_datetime(df["time"])


# ==========================================
# 2. Time features
# ==========================================

df["hour"] = df["time"].dt.hour
df["day"] = df["time"].dt.day
df["month"] = df["time"].dt.month
df["day_of_week"] = (df["time"].dt.dayofweek)
df["day_name"] = (df["time"].dt.day_name())
df["is_weekend"] = (df["day_of_week"] >= 5)


# ==========================================
# 3. Weather features
# ==========================================

df["is_rainy"] = (df["precipitation"] > 0)

def categorize_temperature(temp): 

    if temp < 20: 
        return "Cold"

    elif temp <= 30:
        return "Moderate"

    else: 
        return "Hot"

df["temperature_category"] = (
    df["temperature"]
    .apply(categorize_temperature)
)


# ==========================================
# 4. Display result
# ==========================================

print("===== FEATURE ENGINEERING =====")

print(df.head())

print("\nColumns:")
print(df.columns)

print("\nData types:")
print(df.dtypes)


# ==========================================
# 5. Save feature dataset
# ==========================================

output_file = (
    "data/process/weather_features.csv"
)

df.to_csv(
    output_file,
    index=False
)

print(
    f"\nFeature dataset saved to: {output_file}"
)