import pandas as pd 

# ==========================================
# 1. Load data
# ==========================================

df = pd.read_csv(
    "data/process/weather_features.csv"
)

df["time"] = pd.to_datetime(df["time"])


# ==========================================
# 2. IQR outlier detection function
# ==========================================
def detect_outliers_iqr(df, column): 

    q1 = df[column].quantile(0.25)

    q3 = df[column].quantile(0.75)

    iqr = q3 - q1 

    lower_bound = q1 - 1.5 * iqr

    upper_bound = q3 + 1.5 * iqr 

    outliers = df[
        (df[column] < lower_bound)
        |
        (df[column] > upper_bound)
    ]

    return (
        outliers,
        lower_bound,
        upper_bound
    )


# ==========================================
# 3. Temperature
# ==========================================

outliers, lower, upper = (
    detect_outliers_iqr(
        df, 
        "temperature"
    )
)

print("\n===== TEMPERATURE OUTLIERS =====")

print("Lower bound:", lower)

print("Upper bound:", upper)

print("Number of outlierss", len(outliers))

print(
    outliers[
        [
            "time", 
            "temperature"
        ]
    ]
)


# ==========================================
# 4. Humidity
# ==========================================

outliers, lower, upper = (
    detect_outliers_iqr(
        df, 
        "humidity"
    )
)

print("\n===== HUMIDITY OUTLIERS =====")

print("Lower bound:", lower)

print("Upper bound:", upper)

print("Number of outliers:", len(outliers))

print(
    outliers[
        [
            "time",
            "humidity"
        ]
    ]
)


# ==========================================
# 5. Wind speed
# ==========================================

outliers, lower, upper = (
    detect_outliers_iqr(
        df,
        "wind_speed"
    )
)

print("\n===== WIND SPEED OUTLIERS =====")

print("Lower bound:", lower)

print("Upper bound:", upper)

print("Number of outliers:", len(outliers))

print(
    outliers[
        [
            "time",
            "wind_speed"
        ]
    ]
)


# ==========================================
# 6. Domain validation
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

print("\n===== DOMAIN VALIDATION =====")

print(
    "Invalid humidity:",
    len(invalid_humidity)
)

print(
    "Invalid wind speed:", 
    len(invalid_precipitation)
)