import sys
sys.stdout.reconfigure(encoding='utf-8')

import logging
from pathlib import Path
import pandas as pd 
import numpy as np
import joblib

from sklearn.ensemble import (
    RandomForestRegressor, 
    GradientBoostingRegressor, 
    HistGradientBoostingRegressor
)
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from config.config import FINAL_DATA_FILE, MODEL_FILE, MODEL_DIR

logger = logging.getLogger(__name__)

def create_ml_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["time"] = pd.to_datetime(df["time"])
    df = df.sort_values("time").reset_index(drop=True)

    # 1. Linear Time Features
    df["hour"] = df["time"].dt.hour
    df["dayofweek"] = df["time"].dt.dayofweek
    df["month"] = df["time"].dt.month

    # 2. Cyclical Time Features (Trigonometric 24-hour cycle)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)

    # 3. Lag Features
    df["temp_lag_1"] = df["temperature"].shift(1)
    df["temp_lag_2"] = df["temperature"].shift(2)
    df["temp_lag_24"] = df["temperature"].shift(24)

    # 4. Temperature Momentum & Rate of Change
    df["temp_diff_1"] = df["temp_lag_1"] - df["temp_lag_2"]

    # 5. Rolling Statistics
    df["temp_rolling_mean_6"] = df["temperature"].shift(1).rolling(window=6).mean()

    # 6. Target Variable (Temperature of the next hour)
    df["target_temperature"] = df["temperature"].shift(-1)

    df_ml = df.dropna().reset_index(drop=True)
    return df_ml

def train_weather_model():
    if not Path(FINAL_DATA_FILE).exists():
        logger.error(f"Could not find file {FINAL_DATA_FILE} to train model!")
        raise FileNotFoundError(f"Missing {FINAL_DATA_FILE}")

    print("\n⚔️ ENTERING MACHINE LEARNING MODEL ARENA...")

    df = pd.read_csv(FINAL_DATA_FILE)
    df_ml = create_ml_features(df)

    if len(df_ml) < 30:
        print("⚠️ Warning: Insufficient data to train the ML model. At least 30 records are required.")
        return

    feature_columns = [
        "hour",
        "hour_sin", 
        "hour_cos",
        "humidity",
        "wind_speed",
        "precipitation",
        "temp_lag_1",
        "temp_lag_2",
        "temp_lag_24",
        "temp_diff_1",
        "temp_rolling_mean_6"
    ]

    x = df_ml[feature_columns]
    y = df_ml["target_temperature"]

    # 80% Train, 20% Test (chronological time-series split)
    train_size = int(len(x) * 0.8)
    x_train, x_test = x.iloc[:train_size], x.iloc[train_size:]
    y_train, y_test = y.iloc[:train_size], y.iloc[train_size:]

    # Arena Contenders with Tuned Hyperparameters
    candidate_models = {
        "Random Forest (200 Trees, Depth 6)": RandomForestRegressor(
            n_estimators=200, 
            max_depth=6, 
            min_samples_split=3, 
            random_state=42
        ),
        "Random Forest (150 Trees, Depth 5)": RandomForestRegressor(
            n_estimators=150, 
            max_depth=5, 
            min_samples_split=2, 
            random_state=42
        ),
        "Gradient Boosting (LR 0.05, 120 Estimators)": GradientBoostingRegressor(
            n_estimators=120, 
            learning_rate=0.05, 
            max_depth=3, 
            random_state=42
        ),
        "HistGradientBoosting (Fast Histogram)": HistGradientBoostingRegressor(
            max_iter=80, 
            learning_rate=0.08, 
            max_depth=4, 
            random_state=42
        )
    }

    leaderboard = []

    print("=" * 65)
    print(f"{'Contender':<40} | {'R² Fit':<7} | {'MAE':<7} | {'RMSE':<7}")
    print("-" * 65)

    for name, model in candidate_models.items():
        model.fit(x_train, y_train)
        y_pred = model.predict(x_test)

        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = r2_score(y_test, y_pred)

        leaderboard.append({
            "name": name,
            "model": model,
            "r2": r2,
            "mae": mae,
            "rmse": rmse
        })

        print(f"{name:<40} | {r2 * 100:>6.1f}% | {mae:>5.2f}°C | {rmse:>5.2f}°C")

    print("=" * 65)

    # Rank and select the Champion (highest R², lowest RMSE)
    leaderboard.sort(key=lambda item: (-item["r2"], item["rmse"]))
    champion = leaderboard[0]

    print(f"\n🏆 CHAMPION SELECTED: {champion['name']}")
    print(f"  • Best R² Score: {champion['r2'] * 100:.1f}%")
    print(f"  • Best MAE:      {champion['mae']:.2f} °C")
    print(f"  • Best RMSE:     {champion['rmse']:.2f} °C")
    print("=" * 65)

    # Save the Champion Model artifact
    Path(MODEL_DIR).mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": champion["model"], "features": feature_columns, "name": champion["name"]}, MODEL_FILE)
    print(f"✅ Champion model saved at: {MODEL_FILE}")

if __name__ == "__main__":
    train_weather_model()