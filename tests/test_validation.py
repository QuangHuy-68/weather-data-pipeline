import pandas as pd

class TestValidation:
    def test_temperature_range(self):
        df = pd.DataFrame({ "temperature": [25.0, -60.0, 70.0, 30.0] })
        invalid = ~df["temperature"].between(-50, 60)

        assert invalid.sum() == 2 # -60 and 70: invalid

    def test_humidity_range(self):
        df = pd.DataFrame({ "humidity": [50, -5, 105, 80] })
        invalid = ~df["humidity"].between(0, 100)

        assert invalid.sum() == 2 # -5 and 105: invalid

    def test_no_negative_wind(self):
        df = pd.DataFrame({ "wind_speed": [10.0, -3.0, 5.0] })
        invalid = df["wind_speed"] < 0

        assert invalid.sum() == 1

    def test_no_negative_precipitation(self):
        df = pd.DataFrame({ "precipitation": [0.0, 2.5, -1.0] })
        invalid = df["precipitation"] < 0

        assert invalid.sum() == 1

    def test_no_duplicate_timestamps(self):
        df = pd.DataFrame({ 
            "time": pd.to_datetime([
                "2026-08-25 00:00",
                "2026-08-25 01:00",
                "2026-08-25 01:00"
            ])
        })

        duplicates = df["time"].duplicated()

        assert duplicates.sum() == 1

    def test_hourly_intervals(self):
        df = pd.DataFrame({
            "time": pd.to_datetime([
                "2026-08-25 00:00",
                "2026-08-25 01:00",
                "2026-08-25 03:00"
            ])
        })

        time_diff = df["time"].diff()
        expected = pd.Timedelta(hours=1)
        invalid = (time_diff.dropna() != expected)

        assert invalid.sum() == 1

        