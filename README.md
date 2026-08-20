# 🌦️ Weather Data Pipeline

An end-to-end weather data pipeline built with Python.

This project collects weather data from the Open-Meteo API,
cleans and validates the data, performs feature engineering,
creates daily weather summaries, and generates visualizations.

## 📌 Project Overview

The goal of this project is to build a complete data pipeline
for collecting and analyzing weather data.

The pipeline automatically:

1. Collects weather data from an API
2. Stores raw JSON data
3. Cleans the data
4. Validates data quality
5. Performs feature engineering
6. Creates daily weather summaries
7. Generates weather visualizations
8. Logs pipeline execution

## 🏗️ Pipeline Architecture

```text
Open-Meteo API
      │
      ▼
Raw JSON Data
      │
      ▼
Data Transformation
      │
      ▼
Data Validation
      │
      ▼
Feature Engineering
      │
      ▼
Daily Aggregation
      │
      ▼
Visualization
      │
      ▼
Reports
```



GitHub sẽ hiển thị diagram dạng text.

---

# 6. Tech Stack

Thêm:

```markdown
## 🛠️ Tech Stack

- Python
- Requests
- Pandas
- Matplotlib
- JSON
- pathlib
- Logging
- Git & GitHub
```



## 📊 Data Source

Weather data is collected from the Open-Meteo API.

The pipeline collects hourly weather data including:

- Temperature
- Relative humidity
- Wind speed
- Precipitation



## 🔄 Data Pipeline

### 1. Data Ingestion

The pipeline sends a request to the Open-Meteo API
and saves the response as a raw JSON file.

Raw data is stored in:

data/raw/



### 2. Data Transformation

Raw JSON data is converted into a Pandas DataFrame.

The pipeline performs:

- Datetime conversion
- Numeric conversion
- Duplicate removal
- Missing value checking

Processed data is saved as:

data/process/weather_cleaned.csv


### 3. Data Validation

The pipeline checks data quality including:

- Missing values
- Invalid temperature values
- Invalid humidity values
- Invalid wind speed
- Invalid precipitation
- Duplicate timestamps
- Invalid time intervals
- Missing timestamps



### 4. Feature Engineering

The pipeline creates additional features such as:

- hour
- day
- month
- day_of_week
- day_name
- is_weekend
- is_rainy
- temperature_category
- temp_humidity_index
- wind_category
- rain_intensity
- is_hot



### 5. Daily Aggregation

Hourly weather data is aggregated into daily summaries.

Daily metrics include:

- Average temperature
- Maximum temperature
- Minimum temperature
- Average humidity
- Maximum wind speed
- Total precipitation



### 6. Visualization

The pipeline generates daily weather charts:

- Daily temperature
- Daily humidity
- Daily precipitation

Charts are saved in:

reports/charts/


### 7. Logging

Pipeline execution is recorded using Python's logging module.

Logs are stored in:

logs/pipeline.log

The logs record:

- Pipeline start
- Pipeline steps
- Successful steps
- Failed steps
- Pipeline completion



## 📁 Project Structure

```text
weather-data-pipeline/
│
├── data/
│   ├── raw/
│   └── process/
│
├── logs/
│   └── pipeline.log
│
├── reports/
│   └── charts/
│
├── src/
│   ├── ingestion/
│   ├── transformation/
│   ├── validation/
│   └── analysis/
│
├── pipeline.py
├── README.md
├── requirements.txt
└── .gitignore
```



---

# 14. Installation

Bây giờ người khác clone project về thì phải biết cài dependency.

README:

```markdown
## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/QuangHuy-68/weather-data-pipeline.git

cd weather-data-pipeline
```



---

# 15. Nhưng chúng ta đang thiếu `requirements.txt`

Bạn kiểm tra:

```powershell
dir requirements.txt
```



## ▶️ Run the Pipeline

From the project root directory:

```powershell
python pipeline.py
```
