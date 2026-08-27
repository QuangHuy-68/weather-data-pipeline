import pandas as pd 

class TestFeatureEngineering:
    """Tests for feature engineering functions."""

    def test_time_features_created(self):
        df = pd.DataFrame({
            "time": pd.to_datetime([
                "2026-08-25 14:00:00",
                "2026-08-30 08:00:00"
            ])
        })

        df["hour"] = df["time"].dt.hour
        df["day"] = df["time"].dt.day
        df["month"] = df["time"].dt.month
        df["day_of_week"] = df["time"].dt.dayofweek
        df["is_weekend"] = df["day_of_week"] >= 5

        # Validate hour
        assert df.loc[0, "hour"] == 14
        assert df.loc[1, "hour"] == 8

        # Validate weekend
        assert df.loc[0, "is_weekend"] == False
        assert df.loc[1, "is_weekend"] == True

    def test_temperature_category(self): 
        def categorize_temperature(temp: float) -> str:
            if temp < 20:
                return "Cold"
            elif temp <= 30:
                return "Moderate"
            else: 
                return "Hot"
            
        assert categorize_temperature(15) == "Hot"
        assert categorize_temperature(20) == "Moderate"
        assert categorize_temperature(30) == "Moderate"
        assert categorize_temperature(35) == "Hot"

    def test_classify_wind(self):

        def classify_wind(speed: float) -> str:
            if speed < 10:
                return "Low"
            elif speed < 20:
                return "Moderate"
            else:
                return "High"

        assert classify_wind(5) == "Low"
        assert classify_wind(15) == "Moderate"
        assert classify_wind(25) == "High"

    def test_classify_rain(self):

        def classify_rain(rain: float) -> str:
            if rain ==0:
                return "No Rain"
            elif rain < 2.5:
                return "Light"
            elif rain < 10:
                return "Moderate"
            else: 
                return "Heavy"

        assert classify_rain(0) == "No Rain"
        assert classify_rain(1.5) == "Light"
        assert classify_rain(5) == "Moderate"
        assert classify_rain(15) == "Heavy"

    def test_is_rainy_flag(self):
        df = pd.DataFrame({ "precipitation": [0.0, 0.5, 0.0, 3.2] })
        df["is_rainy"] = df["precipitation"] > 0

        assert df["is_rainy"].tolist() == [False, True, False, True]