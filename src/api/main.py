import sqlite3
import pandas as pd 
import requests

from src.knowledge.retriever import KnowledgeRetriever
from src.api.schemas import ChatQueryRequest, ChatQueryResponse
from src.knowledge.learning_engine import LearningEngine
from pathlib import Path
from typing import List, Optional 
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from config.config import DB_PATH, DAILY_SUMMARY_FILE, PREDICTIONS_FILE
from src.api.schemas import (
    HealthResponse,
    WeatherCurrentResponse,
    WeatherDailyResponse,
    ForecastHourlyItem,
    ForecastResponse,
    ChatQueryResponse,
    ChatQueryRequest,
    FeedbackRequest
) 
from datetime import datetime 
from zoneinfo import ZoneInfo

knowledge_retriever = KnowledgeRetriever()
learning_engine = LearningEngine()

app = FastAPI(
    title="🌦️ Weather Data Pipeline & ML Forecast API",
    description="The REST API provides real-time weather data for multiple cities, GPS-based location, and AI-powered temperature forecasts.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://*.vercel.app", 
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CITIES = {
    "HCM": {"name": "Hồ Chí Minh", "lat": 10.8231, "lon": 106.6297},
    "HN":  {"name": "Hà Nội",      "lat": 21.0285, "lon": 105.8542},
    "DN":  {"name": "Đà Nẵng",     "lat": 16.0544, "lon": 108.2022},
    "CT":  {"name": "Cần Thơ",     "lat": 10.0452, "lon": 105.7469},
    "HP":  {"name": "Hải Phòng",   "lat": 20.8449, "lon": 106.6881},
}

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Weather Data Pipeline Rest API!",
        "docs_url": "/docs",
        "health_check": "/health"
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():

    if not Path(DB_PATH).exists():
        raise HTTPException(status_code=503, detail="Database has not been initialized!")

    with sqlite3.connect(DB_PATH) as conn: 
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM weather_data")
        count = cursor.fetchone()[0]

    return HealthResponse(
        status="healthy",
        pipeline_version="1.1.0",
        total_records=count,
        database_status="connected"
    )

# ====================================================
# 1. Endpoint to retrieve the list of supported cities
# ====================================================
@app.get("/locations", tags=["Locations"])
def get_supported_locations():
    """Returns a list of available cities along with their coordinates."""
    return [
        {"id": key, "name": val["name"], "lat": val["lat"], "lon": val["lon"]}
        for key, val in CITIES.items()
    ]


# ===============================
# 2. Endpoint for current weather
# ===============================
@app.get("/weather/current", response_model=WeatherCurrentResponse, tags=["Weather Data"])
def get_current_weather(
    city: Optional[str] = Query("HCM", description="City code: HCM, HN, DN, CT, HP"),
    lat: Optional[float] = Query(None, description="Device GPS latitude"),
    lon: Optional[float] = Query(None, description="Device GPS longitude")
): 

    # Case 1: 
    if lat is not None and lon is not None:
        try: 
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": lat,
                "longitude": lon, 
                "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation",
                "timezone": "Asia/Ho_Chi_Minh"
            }

            res = requests.get(url, params=params, timeout=10)
            res.raise_for_status()
            current_data = res.json().get("current", {})
            return WeatherCurrentResponse(
                time=current_data.get("time", datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime("%Y-%m-%dT%H:00")),
                location="Your Position (GPS)",
                temperature=float(current_data.get("temperature_2m", 0.0)),
                humidity=int(current_data.get("relative_humidity_2m", 0)),
                wind_speed=float(current_data.get("wind_speed_10m", 0.0)),
                precipitation=float(current_data.get("precipitation", 0.0))
            )
        except Exception as e: 
            raise HTTPException(status_code=502, detail=f"Error retrieving GPS weather data: {str(e)}")


    # Case 2: 
    if city == "HCM": 
        if not Path(DB_PATH).exists():
            raise HTTPException(status_code=404, detail="Database not found")

        now_str = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime("%Y-%m-%dT%H:00")

        with sqlite3.connect(DB_PATH) as conn:
            query = """
                SELECT time, temperature, humidity, wind_speed, precipitation 
                FROM weather_data
                WHERE time <= ? 
                ORDER BY time DESC
                LIMIT 1 
            """
            df = pd.read_sql_query(query, conn, params=[now_str])

            if df.empty: 
                df = pd.read_sql_query("SELECT time, temperature, humidity, wind_speed, precipitation FROM weather_data ORDER BY time DESC LIMIT 1", conn)

        if df.empty: 
            raise HTTPException(status_code=404, detail="No weather data found")

        row = df.iloc[0]

        return WeatherCurrentResponse(time=str(row["time"]),
                                    location="Ho Chi Minh City",
                                    temperature=float(row["temperature"]),
                                    humidity=int(row["humidity"]),           
                                    wind_speed=float(row["wind_speed"]),  
                                    precipitation=float(row["precipitation"])) 


    # Case 3: 
    if city in CITIES: 
        target = CITIES[city]
        try:
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": target["lat"],
                "longitude": target["lon"],
                "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation",
                "timezone": "Asia/Ho_Chi_Minh"
            }

            res = requests.get(url, params=params, timeout=10)
            res.raise_for_status()
            current_data = res.json().get("current", {})
            return WeatherCurrentResponse(
                time=current_data.get("time", datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime("%Y-%m-%dT%H:00")),
                location=target["name"],
                temperature=float(current_data.get("temperature_2m", 0.0)),
                humidity=int(current_data.get("relative_humidity_2m", 0)), 
                wind_speed=float(current_data.get("wind_speed_10m", 0.0)),
                precipitation=float(current_data.get("precipitation", 0.0))
            )

        except Exception as e: 
            raise HTTPException(status_code=502, detail=f"Error retrieving GPS weather data: {target['name']}: {str(e)}")

    raise HTTPException(status_code=400, detail=f"City code '{city}' is invalid!")


# ==============================
# 3. Endpoint for daily overview
# ==============================
@app.get("/weather/daily", response_model=List[WeatherDailyResponse], tags=["Weather Data"])
def get_daily_summary(
    limit: Optional[int] = Query(7, ge=1, le=30, description="Number of days to retrieve"),
    city: Optional[str] = Query("HCM", description="City Code: HCM, HN, DN, CT, HP"),
    lat: Optional[float] = Query(None, description="Device GPS latitude"),
    lon: Optional[float] = Query(None, description="Device GPS longitude")
    ):

    # If the location is Ho Chi Minh City and GPS data is not being transmitted -> Read from the consolidated pipeline CSV file.
    if (city == "HCM" or city is None) and lat is None and lon is None:
        if not Path(DAILY_SUMMARY_FILE).exists():
            raise HTTPException(status_code=404,detail="Daily summary file not found")

        df_daily = pd.read_csv(DAILY_SUMMARY_FILE).head(limit)

        results = []

        for _, row in df_daily.iterrows():
            results.append(WeatherDailyResponse(date=str(row["date"]),

                avg_temperature=round(float(row["avg_temperature"]), 1),
                max_temperature=round(float(row["max_temperature"]), 1),
                min_temperature=round(float(row["min_temperature"]), 1),
                avg_humidity=round(float(row["avg_humidity"]), 1),
                max_wind_speed=round(float(row["max_wind_speed"]), 1),
                total_precipitation=round(float(row["total_precipitation"]), 1)))

        return results

    target_lat = lat
    target_lon = lon
    if target_lat is None or target_lon is None:
        if city in CITIES: 
            target_lat = CITIES[city]["lat"]
            target_lon = CITIES[city]["lon"]

        else: 
            raise HTTPException(status_code=400, detail=f"City Code '{city}' is invalid!")

    try: 
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": target_lat, 
            "longitude": target_lon,
            "daily": "temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum",
            "timezone": "Asia/Ho_Chi_Minh",
            "forecast_days": min(limit, 16)
            }

        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        daily_data = res.json().get("daily", {})

        dates = daily_data.get("time", [])
        max_temps = daily_data.get("temperature_2m_max", [])
        min_temps = daily_data.get("temperature_2m_min", [])
        max_winds = daily_data.get("wind_speed_10m_max", [])
        precips = daily_data.get("precipitation_sum", [])

        results = []
        for i in range(min(len(dates), limit)): 
            t_max = float(max_temps[i]) if max_temps[i] is not None else 0.0
            t_min = float(min_temps[i]) if min_temps[i] is not None else 0.0
            avg_t = round((t_max + t_min) / 2.0, 1)

            results.append(WeatherDailyResponse(
                date=str(dates[i]),
                avg_temperature=avg_t,
                max_temperature=round(t_max, 1),
                min_temperature=round(t_min, 1),
                avg_humidity=75.0,
                max_wind_speed=round(float(max_winds[i]) if max_winds[i] is not None else 0.0, 1),
                total_precipitation=round(float(precips[i]) if precips[i] is not None else 0.0, 1)
            ))

        return results

    except Exception as e: 
        raise HTTPException(status_code=502, detail=f"Error retrieving daily forecast data: {str(e)}")


# =======================================
# 4. Machine Learning prediction endpoint
# =======================================
@app.get("/weather/forecast", response_model=ForecastResponse, tags=["Machine Learning"])
def get_ml_forecast(limit: Optional[int] = Query(24, ge=1, le=168, description="Number of forecast hours to retrieve")):

    if not Path(PREDICTIONS_FILE).exists():
        raise HTTPException(status_code=404, detail="Predictions file not found")

    df_pred = pd.read_csv(PREDICTIONS_FILE).head(limit)
    items = []

    for _, row in df_pred.iterrows():
        items.append(ForecastHourlyItem(time=str(row["time"]),
                     actual_temperature=float(row["actual_temperature"]) if pd.notnull(row.get("actual_temperature")) else None,
                     predicted_temperature=float(row["predicted_temperature"]),
                     difference=float(row["difference"]) if pd.notnull(row.get("difference")) else None
                    ))

    return ForecastResponse(model_name="Random Forest Regressor (Time-Series Lag)", 
                            total_forecast_hours=len(items), predictions=items)    

@app.post("/api/chat/ask", response_model=ChatQueryResponse, tags=["AI Knowledge Assistant"])
def ask_weather_assistant(payload: ChatQueryRequest):
    """
    Intelligent Knowledge Base & Continuous Learning endpoint for SkyBot AI.
    Features: Persistent habit memory, active entity learning, and real-time weather advice.
    """
    query = payload.query.strip()
    if not query: 
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    user_id = payload.user_id or "default_user"
    personalized_note = ""
    # 1. Trích xuất địa danh từ Knowledge Base
    matched_loc = knowledge_retriever.extract_location(query)
    # 2. ACTIVE LEARNING: Nếu chưa có trong DB, thử tự học địa danh mới
    if not matched_loc:
        newly_learned = learning_engine.discover_and_learn_location(query)
        if newly_learned:
            matched_loc = newly_learned
            # Nạp lại cache để Knowledge Retriever cập nhật ngay lập tức
            knowledge_retriever._load_knowledge_cache()
            personalized_note = " *(✨ SkyBot vừa tự học địa danh mới này!)*"
    if matched_loc: 
        loc_name = matched_loc["name"]
        lat = matched_loc["latitude"]
        lon = matched_loc["longitude"]
    else: 
        # 3. PERSONALIZED MEMORY: Kiểm tra xem người dùng có thói quen hỏi thành phố nào không
        user_mem = learning_engine.get_user_memory(user_id)
        if user_mem and user_mem.get("favorite_location"):
            fav_name = user_mem["favorite_location"]
            fav_loc = knowledge_retriever.extract_location(fav_name)
            if fav_loc:
                loc_name = fav_loc["name"]
                lat = fav_loc["latitude"]
                lon = fav_loc["longitude"]
                personalized_note = f" *(📍 Tự động chọn {loc_name} theo thói quen của bạn)*"
            else:
                city_code = payload.current_city if payload.current_city in CITIES else "HN"
                city_info = CITIES[city_code]
                loc_name, lat, lon = city_info["name"], city_info["lat"], city_info["lon"]
        else:
            # Fallback mặc định theo thành phố đang chọn trên App
            city_code = payload.current_city if payload.current_city in CITIES else "HN"
            city_info = CITIES[city_code]
            loc_name, lat, lon = city_info["name"], city_info["lat"], city_info["lon"]
    # 4. Phân loại ý định (Intent)
    intent = knowledge_retriever.detect_intent(query)
    # 5. Xử lý câu hỏi FAQ từ Knowledge Base & Mô hình ML
    if intent.startswith("faq:"): 
        topic_key = intent.split(":", 1)[1]
        faq_answer = knowledge_retriever.match_faq(topic_key, lang=payload.lang)
        if faq_answer: 
            if topic_key == "ml_model_info" and Path(PREDICTIONS_FILE).exists():
                try:
                    df_pred = pd.read_csv(PREDICTIONS_FILE).dropna(subset=["predicted_temperature"]).head(4)
                    sample_lines = [f"  • {str(row['time']).split(' ')[-1][:5]}: {round(float(row['predicted_temperature']), 1)}°C" for _, row in df_pred.iterrows()]
                    faq_answer += "\n\n🔮 **Dự báo nhiệt độ thời gian thực từ Model Champion (4 giờ tới):**\n" + "\n".join(sample_lines) + "\n*(Độ chính xác R²: 90.3% - Sai số trung bình MAE: 0.50°C)*"
                except Exception as ex:
                    print(f"ML forecast extraction warning: {ex}")
            # Ghi nhật ký tương tác để học tiếp
            learning_engine.log_interaction(user_id, query, intent, loc_name)
            return ChatQueryResponse(
                answer=f"💡 [Tri thức SkyBot]: {faq_answer}",
                target_location=loc_name,
                latitude=lat,
                longitude=lon,
                intent=intent
            )
    # 6. Lấy dữ liệu thời tiết thực tế
    current_temp, humidity, current_rain, max_rain_prob, wind_speed = 28.0, 70.0, 0.0, 10.0, 10.0
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=precipitation_probability&timezone=auto"
        res = requests.get(url, timeout=5)
        if res.status_code == 200: 
            w_data = res.json()
            curr = w_data.get("current", {})
            current_temp = curr.get("temperature_2m", 28.0)
            humidity = curr.get("relative_humidity_2m", 70.0)
            current_rain = curr.get("precipitation", 0.0)
            wind_speed = curr.get("wind_speed_10m", 10.0)
            hourly_prob = w_data.get("hourly", {}).get("precipitation_probability", [])
            curr_h = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).hour
            next_12h = hourly_prob[curr_h: curr_h + 12]
            if next_12h:
                max_rain_prob = max(next_12h)
    except Exception as e: 
        print(f"Weather API fetch warning: {e}")
    # 7. Đánh giá cẩm nang Brand Hub
    if intent in ["umbrella", "clothing", "workout", "laundry", "car_wash"]: 
        advice = knowledge_retriever.evaluate_rule(
            category=intent,
            temperature=current_temp,
            max_rain_prob=max_rain_prob,
            current_rain=current_rain,
            humidity=humidity,
            lang=payload.lang
        ) 
        answer = f"📍 Thời tiết **{loc_name}** ({current_temp}°C, độ ẩm {humidity}%){personalized_note}:\n👉 {advice}"
    else: 
        rain_desc = "đang có mưa" if current_rain > 0 else f"nguy cơ mưa cao nhất 12h tới là {round(max_rain_prob)}%"
        answer = (
            f"📍 Thời tiết hiện tại ở **{loc_name}**{personalized_note}:\n"
            f"• Nhiệt độ: **{current_temp}°C**\n"
            f"• Độ ẩm: **{humidity}%** | Gió: **{wind_speed} km/h**\n"
            f"• Khả năng mưa: **{rain_desc}**.\n"
            f"👉 Bạn có thể hỏi tôi về việc mang ô, mặc gì, phơi đồ, rửa xe hoặc chạy bộ tại {loc_name} nhé!"
        )
    # 8. GHI NHẬT KÝ VÀ HỌC THÓI QUEN NGƯỜI DÙNG
    learning_engine.log_interaction(user_id, query, intent, loc_name)
    return ChatQueryResponse(
        answer=answer,
        target_location=loc_name,
        latitude=lat, 
        longitude=lon,
        intent=intent,
        current_temp=current_temp,
        rain_prob=max_rain_prob
    )

# =======================================================
# 6. User Feedback Loop Endpoint (👍 / 👎)
# =======================================================
@app.post("/api/chat/feedback", tags=["AI Chatbot"])
def submit_chat_feedback(payload: FeedbackRequest):
    """
    Records thumbs up (+1) or thumbs down (-1) user feedback
    to continuously audit and improve SkyBot's intelligence.
    """
    learning_engine.record_feedback(
        query=payload.query,
        answer=payload.answer,
        rating=payload.rating,
        comment=payload.comment
    )
    return {
        "status": "success",
        "message": "Thank you for your feedback! SkyBot has recorded this to improve."
    }