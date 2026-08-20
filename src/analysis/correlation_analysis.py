import pandas as pd 
import matplotlib.pyplot as plt

# ==========================================
# 1. Load data
# ==========================================

df = pd.read_csv(
    "data/process/weather_final.csv"
)

df["time"] = pd.to_datetime(df["time"])


# ==========================================
# 2. Select weather variables
# ==========================================

weather_columns = [
    "temperature",
    "humidity",
    "wind_speed",
    "precipitation"
]


# ==========================================
# 3. Calculate correlation
# ==========================================

correlation_matrix = (
    df[weather_columns]
    .corr()
)

print("\n===== CORRELATION MATRIX =====")

print(correlation_matrix)


# ==========================================
# 4. Correlation heatmap
# ==========================================

plt.figure(figsize=(8,6))

plt.imshow(
    correlation_matrix,
    cmap="coolwarm",
    vmin=-1,
    vmax=1
)

plt.colorbar(
    label="Correlation"
)

plt.xticks(
    range(len(weather_columns)),
    weather_columns
)

plt.yticks(
    range(len(weather_columns)),
    weather_columns
)

# Display values
for i in range(len(weather_columns)):
    for j in range(len(weather_columns)):

        value = correlation_matrix.iloc[i, j]

        plt.text(
            i,
            j,
            f"{value:.2f}",
            ha="center",
            va="center"
        )

plt.title(
    "Weather Variables Correlation"
)

plt.tight_layout()

plt.show()