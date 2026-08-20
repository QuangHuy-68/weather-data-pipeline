import pandas as pd 

# ==========================================
# 1. Load feature dataset
# ==========================================

df = pd.read_csv(
    "data/process/weather_features.csv"
)

df["time"] = pd.to_datetime(df["time"])

print("Original rows:", len(df))


# ==========================================
# 2. Domain validation
# ==========================================

invalid_humidity = df[
    (df["humidity"] < 0)
    |
    (df["humidity"] > 100)
]

invalid_wind = df[
    df["wind_speed"] < 0
]

invalid_precipitation = df[
    df["precipitation"] < 0
]


# ==========================================
# 3. Collect invalid rows
# ==========================================

invalid_indexes = set(
    invalid_humidity.index
)

invalid_indexes.update(
    invalid_wind.index
)

invalid_indexes.update(
    invalid_precipitation.index
)


# ==========================================
# 4. Remove invalid records
# ==========================================

df_final = df.drop(
    index=invalid_indexes
)

# ==========================================
# 5. Remove duplicates
# ==========================================

duplicate_count = (
    df_final.duplicated().sum()
)

df_final = (
    df_final
    .drop_duplicates()
)


# ==========================================
# 6. Quality check
# ==========================================

print(
    "\nRemoved invalid rows:",
    len(df) - len(df_final)
)

print(
    "Duplicate rows found:",
    duplicate_count
)

print(
    "Final rows:",
    len(df_final)
)

print("\nMissing values:")

print(df_final.isnull().sum())


# ==========================================
# 7. Save final dataset
# ==========================================

output_file = (
    "data/process/weather_final.csv"
)

df_final.to_csv(
    output_file,
    index=False
)

print(
    f"\nFinal dataset saved to: {output_file}"
)