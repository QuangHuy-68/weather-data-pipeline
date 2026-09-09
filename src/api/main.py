import sqlite3
import pandas as pd 

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
    ForecastResponse
) 


app = FastAPI(
    title="🌦️ Weather Data Pipeline & ML Forecast API",
    description="The REST API provides real-time weather data, aggregated analytics, and AI-driven forecasts.",
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
        pipeline_version="1.0.0",
        total_records=count,
        database_status="connected"
    )


@app.get("/weather/current", response_model=WeatherCurrentResponse, tags=["Weather Data"])
def get_current_weather(): 

    if not Path(DB_PATH).exists():
        raise HTTPException(status_code=404, detail="Database not found")

    with sqlite3.connect(DB_PATH) as conn:
        query = """
            SELECT 
                time,
                temperature,
                humidity,
                wind_speed,
                precipitation
            FROM weather_data
            ORDER BY time DESC
            LIMIT 1
            """
        df = pd.read_sql_query(query, conn)

    if df.empty: 
        raise HTTPException(status_code=404, detail="No weather data found")

    row = df.iloc[0]

    return WeatherCurrentResponse(time=str(row["time"]),
                                  location="Ho Chi Minh City",
                                  temperature=float(row["temperature"]),
                                  humidity=int(row["humidity"]),           
                                  wind_speed=float(row["wind_speed"]),  
                                  precipitation=float(row["precipitation"])) 


@app.get("/weather/daily", response_model=List[WeatherDailyResponse], tags=["Weather Data"])
def get_daily_summary(limit: Optional[int] = Query(7, ge=1, le=30, description="Number of days to retrieve")):

    if not Path(DAILY_SUMMARY_FILE).exists():
        raise HTTPException(status_code=404,detail="Daily summary file not found")

    df_daily = pd.read_csv(DAILY_SUMMARY_FILE)
    df_daily = df_daily.head(limit)

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
        