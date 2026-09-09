from pydantic import BaseModel, Field
from typing import List, Optional


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    pipeline_version: str = Field(..., example="1.0.0")
    total_records: int = Field(..., example=168)
    database_status: str = Field(..., example="connected")


class WeatherCurrentResponse(BaseModel):
    time: str = Field(..., example="026-08-28 14:00:00")
    location: str = Field(..., example="Ho Chi Minh City")
    temperature: float = Field(..., example=28.5)
    humidity: int = Field(..., exmaple=78)
    wind_speed: float = Field(..., example=12.4)
    precipitation: float = Field(..., example=0.0)


class WeatherDailyResponse(BaseModel):
    date: str = Field(..., example="2026-08-28")
    avg_temperature: float = Field(..., example=27.5)
    max_temperature: float = Field(..., example=33.0)
    min_temperature: float = Field(..., example=25.0)
    avg_humidity: float = Field(..., example=82.0)
    max_wind_speed: float = Field(..., example=16.5)
    total_precipitation: float = Field(..., example=12.0)


class ForecastHourlyItem(BaseModel):
    time: str = Field(..., example="2026-08-38 15:00:00")
    actual_temperature: Optional[float] = Field(None,example=28.2)
    predicted_temperature: float = Field(..., example=28.4)
    difference: Optional[float] = Field(None, example=0.2)


class ForecastResponse(BaseModel):
    model_name: str = Field(..., example="Random Forest Regressor")
    total_forecast_hours: int = Field(..., example=24)
    predictions: List[ForecastHourlyItem]