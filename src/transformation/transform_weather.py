import json
from pathlib import Path

import pandas as pd

# 1.Find raw data files
raw_data_dir = Path("data/raw")
files = list(raw_data_dir.glob("weather_*.json"))

if not files: 
    raise FileNotFoundError("No weather JSON files found.")

# 2.Get latest file
latest_file = max(files, key=lambda file: file.stat().st_mtime)

print(f"Reading: {latest_file}")

# 3. Load JSON
with open(latest_file, "r", encoding="utf-8") as file:
    data = json.load(file)

# 4. Get hourly data
hourly = data["hourly"]

# 5. Create DataFrame
df = pd.DataFrame({
    "time": hourly["time"],
    "temperature": hourly["temperature_2m"],
    "humidity": hourly["relative_humidity_2m"],
    "wind_speed": hourly["wind_speed_10m"],
    "precipitation": hourly["precipitation"]
})

# 6. Data Cleaning
df_clean = df.copy()

# Convert time 
df_clean["time"] = pd.to_datetime(
    df_clean["time"],
    errors="coerce"
)

# Convert numeric columns
numeric_columns = [
    "temperature",
    "humidity",
    "wind_speed",
    "precipitation"
]

for column in numeric_columns:
    df_clean[column] = pd.to_numeric(
        df_clean[column],
        errors="coerce"
    )

# Remove duplicate rows
df_clean = df_clean.drop_duplicates()

# 7. Data Quality Check
print("\nMissing values:")
print(df_clean.isnull().sum())

print("\nDuplicate rows:")
print(df_clean.duplicated().sum())

print("\nData types:")
print(df_clean.dtypes)

print("\nTemperature statistics:")
print(df_clean["temperature"].describe())

# 8. Save processed data
processed_dir = Path("data/process")

processed_dir.mkdir(parents=True, exist_ok=True)

output_file = processed_dir / "weather_cleaned.csv"

df_clean.to_csv(output_file, index=False)

print(f"\nCleaned data saved to: {output_file}")


