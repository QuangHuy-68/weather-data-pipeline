import logging 
import pandas as pd
import joblib

from pathlib import Path
from config.config import FINAL_DATA_FILE, MODEL_FILE, PREDICTIONS_FILE
from src.ml.train_model import create_ml_features

logger = logging.getLogger(__name__)

def predict_future_temperature():

    if not Path(MODEL_FILE).exists() or not Path(FINAL_DATA_FILE).exists():
        logger.warning("No model or data available for forecasting yet. Training is currently underway...")
        from src.ml.train_model import train_weather_model
        train_weather_model()


    # Load model
    saved_obj = joblib.load(MODEL_FILE)
    model = saved_obj["model"]
    feature_columns = saved_obj["features"]

    df = pd.read_csv(FINAL_DATA_FILE)
    df_ml = create_ml_features(df)

    x = df_ml[feature_columns]
    df_ml["predicted_temperature"] = model.predict(x)

    result_df = pd.DataFrame({
        "time": df_ml["time"],
        "actual_temperature": df_ml["target_temperature"],
        "predicted_temperature": df_ml["predicted_temperature"].round(1),
        "difference": (df_ml["target_temperature"] - df_ml["predicted_temperature"]).round(2)
    })


    Path(PREDICTIONS_FILE).parent.mkdir(parents=True, exist_ok=True)
    result_df.to_csv(PREDICTIONS_FILE, index=False)

    print(f"🔮 ML prediction complete! Saved to: {PREDICTIONS_FILE}")
    return result_df

if __name__ == "__main__":
    predict_future_temperature()
