import pandas as pd

# ==========================================
# 1. Load feature dataset
# ==========================================

df = pd.read_csv(
    "data/process/weather_features_v2.csv"
)

df["time"] = pd.to_datetime(df["time"])

print("Original rows:", len(df))


# ==========================================
# 2. Create date
# ==========================================

df["date"] = df["time"].dt.date


# ==========================================
# 3. Daily aggregation
# ==========================================

daily_summary = (
    df.groupby("date")
    .agg(
        avg_temperature=("temperature", "mean"),
        max_temperature=("temperature", "max"),
        min_temperature=("temperature", "min"),
        avg_humidity=("humidity", "mean"),
        max_wind_speed=("wind_speed", "max"),
        total_precipitation=("precipitation", "sum")
    )
    .reset_index()
)


# ==========================================
# 4. Display summary
# ==========================================

print("\n===== DAILY WEATHER SUMMARY =====")

print(daily_summary)


# ==========================================
# 5. Hottest day
# ==========================================

hottest_day = daily_summary.loc[
    daily_summary["max_temperature"].idxmax()
]

print("\n===== HOTTEST DAY =====")

print(hottest_day)


# ==========================================
# 6. Rainiest day
# ==========================================

rainiest_day = daily_summary.loc[
    daily_summary["total_precipitation"].idxmax()
]

print("\n===== RAINIEST DAY =====")

print(rainiest_day)


# ==========================================
# 7. Rainy days
# ==========================================

rainy_days = daily_summary[
    daily_summary["total_precipitation"] > 0
]

print(
    "\nRainy days:",
    len(rainy_days)
)


# ==========================================
# 8. Save daily summary
# ==========================================

output_file = (
    "data/process/weather_daily_summary.csv"
)

daily_summary.to_csv(
    output_file,
    index=False
)

print(
    f"\nDaily summary saved to: {output_file}"
)