import logging
from pathlib import Path
import pandas as pd 
import numpy as np
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from config.config import FINAL_DATA_FILE, MODEL_FILE, MODEL_DIR

logger = logging.getLogger(__name__)

def create_ml_features(df: pd.DataFrame) -> pd.DataFrame:

    df = df.copy()
    df["time"] = pd.to_datetime(df["time"])
    df = df.sort_values("time").reset_index(drop=True)

    # 1. Time Features
    df["hour"] = df["time"].dt.hour
    df["dayofweek"] = df["time"].dt.dayofweek
    df["month"] = df["time"].dt.month

    # 2. Lag Features
    df["temp_lag_1"] = df["temperature"].shift(1)
    df["temp_lag_2"] = df["temperature"].shift(2)
    df["temp_lag_24"] = df["temperature"].shift(24)

    # 3. Rolling statistics
    df["temp_rolling_mean_6"] = df["temperature"].shift(1).rolling(window=6).mean()

    # 4. Target Variable
    df["target_temperature"] = df["temperature"].shift(-1)

    df_ml = df.dropna().reset_index(drop=True)
    return df_ml

def train_weather_model():

    if not Path(FINAL_DATA_FILE).exists():
        logger.error(f"Could not find file {FINAL_DATA_FILE} to train model!")
        raise FileNotFoundError(f"Missing {FINAL_DATA_FILE}")

    print("\n🤖 Training machine learning model...")

    df = pd.read_csv(FINAL_DATA_FILE)
    df_ml = create_ml_features(df)

    if len(df_ml) < 30:
        print("⚠️ Warning: Insufficient data to train the ML model. At least 30 records are required.")
        return

    feature_columns = [
        "hour", 
        "dayofweek",
        "month",
        "humidity",
        "wind_speed",
        "precipitation",
        "temp_lag_1",
        "temp_lag_2",
        "temp_lag_24",
        "temp_rolling_mean_6"
    ]

    x = df_ml[feature_columns]
    y = df_ml["target_temperature"]

    # 80% Train, 20% Test
    train_size = int(len(x) * 0.8)
    x_train, x_test = x.iloc[:train_size], x.iloc[train_size:]
    y_train, y_test = y.iloc[:train_size], y.iloc[train_size:]


    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=8)
    model.fit(x_train, y_train)

    # Data test 
    y_pred = model.predict(x_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print("=" * 45)
    print("📊 MACHINE LEARNING MODEL EVALUATION RESULTS:")
    print(f"  • MAE (Mean Absolute Error): {mae:.2f} °C")
    print(f"  • RMSE (Root Mean Square Error): {rmse:.2f} °C")
    print(f"  • R² Score (Model fit): {r2 * 100:.1f}%")
    print("=" * 45)

    # Save model into "models" folder
    Path(MODEL_DIR).mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": feature_columns}, MODEL_FILE)

    print(f"✅ Model saved at: {MODEL_FILE}")

if __name__ == "__main__":
    train_weather_model()