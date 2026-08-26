import json
import pytest
import pandas as pd

from pathlib import Path

class TestTransformWeather:
    """Tests for transform_weather module."""

    def test_dataframe_has_required_coloumns(self, tmp_path):

        # 1. Arrange - Create fake data
        fake_data = {
            "hourly": {
                "time": [
                    "2026-08-25T00:00",
                    "2026-08-25T01:00",
                    "2026-08-25T02:00"
                ],
                "temperature_2m": [27.5, 26.8, 26.2],
                "relative_humidity_2m": [85, 88, 90],
                "wind_speed_10m": [12.3, 10.5, 8.7],
                "precipitation": [0.0, 0.5, 1.2]
            }
        }

        # soft save into JSON file
        raw_dir = tmp_path / "data" / "raw"
        raw_dir.mkdir(parents=True)
        json_file = raw_dir / "weather_20260825_000000.json"
        json_file.write_text(json.dumps(fake_data))

        # 2. Act - Read and Transform 
        with open(json_file, "r") as f: 
            data = json.load(f)

        hourly = data["hourly"]
        df = pd.DataFrame({
            "time": hourly["time"],
            "temperature": hourly["temperature_2m"],
            "humidity": hourly["relative_humidity_2m"],
            "wind_speed": hourly["wind_speed_10m"],
            "precipitation": hourly["precipitation"]
        })        

        # 3. Assert - validation
        expected_columns = [
            "time", "temperature", "humidity", "wind_speed", "precipitation"
        ]

        for col in expected_columns:
            assert col in df.columns, f"Missing column: {col}"

    def test_no_duplicates_after_cleaning(self):

        # Create duplicated data
        df = pd.DataFrame({
            "time": ["2026-08-25T00:00", "2026-08-25T00:00", "2026-08-25T01:00"],
            "temperature": [27.5, 27.5, 26.8],
            "humidity": [85, 85, 88],
            "wind_speed": [12.3, 12.3, 10.5],
            "precipitation": [0.0, 0.0, 0.5]
        })

        df_clean = df.drop_duplicates()

        assert len(df_clean) == 2, f"Expected 2 rows, got {len(df_clean)}"
        assert df_clean.duplicated().sum() == 0

    def test_datetime_conversion(self):

        df = pd.DataFrame({
            "time": ["2026-08-25T00:00", "2026-08-25T01:00"]
        })

        df["time"] = pd.to_datetime(df["time"],errors="coerce")

        assert pd.api.types.is_datetime64_any_dtype(df["time"])

        assert df["time"].isnull().sum() == 0 