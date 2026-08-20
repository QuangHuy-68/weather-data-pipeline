import pandas as pd 
import matplotlib.pyplot as plt
from pathlib import Path

# ==========================================
# 1. Load daily dataset
# ==========================================

df = pd.read_csv(
    "data/process/weather_daily_summary.csv"
)

df["date"] = pd.to_datetime(
    df["date"]
)

print("===== DAILY DATA =====")

print(df)


# ==========================================
# 2. Create chart directory
# ==========================================

chart_dir = Path(
    "reports/charts"
)

chart_dir.mkdir(
    parents=True,
    exist_ok=True
)


# ==========================================
# 3. Temperature chart
# ==========================================

plt.figure(figsize=(12,6))

plt.plot(
    df["date"],
    df["avg_temperature"],
    marker="o",
    label="Average"
)

plt.plot(
    df["date"],
    df["max_temperature"],
    marker="o",
    label="Maximum"
)

plt.plot(
    df["date"],
    df["min_temperature"],
    marker="o",
    label="Minimum"
)

plt.xlabel("Date")

plt.ylabel("Temperature (°C)")

plt.title("Daily Temperature")

plt.legend()

plt.xticks(rotation=45)

plt.tight_layout()

plt.savefig(
    chart_dir / "daily_temperature.png"
)

plt.show()


# ==========================================
# 4. Humidity chart
# ==========================================

plt.figure(figsize=(12, 5))

plt.plot(
    df["date"],
    df["avg_humidity"],
    marker="o"
)

plt.xlabel("Date")

plt.ylabel("Humidity (%)")

plt.title(
    "Average Daily Humidity"
)

plt.xticks(rotation=45)

plt.tight_layout()

plt.savefig(
    chart_dir / "daily_humidity.png"
)

plt.show()


# ==========================================
# 5. Precipitation chart
# ==========================================

plt.figure(figsize=(12, 5))

plt.bar(
    df["date"],
    df["total_precipitation"]
)

plt.xlabel("Date")

plt.ylabel("precipitation")

plt.title("Daily Precipitation")

plt.xticks(rotation=45)

plt.tight_layout()

plt.savefig(
    chart_dir / "daily_precipitation.png"
)

plt.show()

print(
    "\nCharts saved to:",
    chart_dir
)