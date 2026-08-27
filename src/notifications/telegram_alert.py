import os
import logging
import requests
import pandas as pd

from datetime import  datetime
from pathlib import Path
from config.config import (
    DAILY_SUMMARY_FILE,
    FEATURES_V2_FILE,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID
)

logger = logging.getLogger(__name__)

def send_telegram_message(message: str) -> bool:

    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram Bot Token or Chat ID has not been configured in .env!")
        print("⚠️ Skipping Telegram dispatch because Token/Chat ID is not configured.")

        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }

    try: 
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()

        logger.info("Telegram notification sent successfully!")

        print("📱 Weather notification sent via Telegram!")

        return True

    except Exception as e: 
        logger.error(f"Failed to send Telegram message: {e}")

        return False


def generate_weather_alert() -> None:

    if not Path(DAILY_SUMMARY_FILE).exists() or not Path(FEATURES_V2_FILE).exists():
        logger.error("Could not find the aggregated data file to generate the alert.")

        return

    df_daily = pd.read_csv(DAILY_SUMMARY_FILE)
    df_features = pd.read_csv(FEATURES_V2_FILE)

    # today data

    today_summary = df_daily.iloc[0]
    date_str = today_summary["date"]
    avg_temp = today_summary["avg_temperature"]
    max_temp = today_summary["max_temperature"]
    min_temp = today_summary["min_temperature"]
    avg_hum = today_summary["avg_humidity"]
    total_rain = today_summary["total_precipitation"]
    max_wind = today_summary["max_wind_speed"]


    alerts = []
    if max_temp >= 33.0: 
        alerts.append("🔥 *HEAT WARNING:* Temperatures reaching high-risk levels (above 33°C)!")

    if total_rain >= 15.0: 
        alerts.append("🌧️ *HEAVY RAIN WARNING:* Heavy rainfall forecast—beware of localized flooding!")

    if max_wind >= 20.0:
        alerts.append("💨 *STRONG WIND WARNING:* Peak gusts exceeding 20 km/h!")

    alert_text = "\n".join(alerts) if alerts else "✅ The weather today is generally favorable, with no hazardous weather warnings."

    message = f"""
        🌦️ *TODAY'S WEATHER REPORT ({date_str})*
        🌡️ *Temperature:* {min_temp:.1f}°C - {max_temp:.1f}°C (Avg: {avg_temp:.1f}°C)
        💧 *Avg. Humidity:* {avg_hum:.1f}%
        🌧️ *Total Rainfall:* {total_rain:.1f} mm
        💨 *Peak Wind Speed:* {max_wind:.1f} km/h
        📢 *Warnings & Advice:*{alert_text}
        _Weather Data Pipeline automatically updated at {datetime.now().strftime('%H:%M %d/%m/%Y')}_
    """

    send_telegram_message(message.strip())

if __name__ == "__main__":
    generate_weather_alert()

        