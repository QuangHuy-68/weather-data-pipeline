
# 🌦️ End-to-End Weather Data Pipeline & AI Forecasting Platform

[![Python CI Pipeline](https://github.com/QuangHuy-68/weather-data-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/QuangHuy-68/weather-data-pipeline/actions)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://weather-data-pipeline-er66.onrender.com/docs)
[![React PWA](https://img.shields.io/badge/React-19_PWA-61DAFB.svg?logo=react&logoColor=black)](https://weather-data-pipeline-one.vercel.app)
[![Streamlit](https://img.shields.io/badge/Streamlit-Cloud-FF4B4B.svg?logo=streamlit&logoColor=white)](https://weather-data-pipeline-2tnainwikjfawai76ekqqn.streamlit.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade, end-to-end Data Engineering & Machine Learning pipeline that ingests real-time hourly meteorological data, validates data quality, persists across OLTP (SQLite) and OLAP (DuckDB + Parquet) storage, predicts future temperatures using Random Forest regression, orchestrates workflows via Apache Airflow, and serves insights through a FastAPI REST API, a Streamlit analytics dashboard, and an installable React PWA.

---

## 🌐 Live Demonstrations

| Platform                         | Type                                        | URL                                                                                                      |
| :------------------------------- | :------------------------------------------ | :------------------------------------------------------------------------------------------------------- |
| **📱 Mobile PWA App**      | Progressive Web App (React 19, TailwindCSS) | [weather-data-pipeline-one.vercel.app](https://weather-data-pipeline-one.vercel.app)                      |
| **⚡ Production API**      | FastAPI REST API + Interactive Swagger UI   | [weather-data-pipeline-er66.onrender.com/docs](https://weather-data-pipeline-er66.onrender.com/docs)      |
| **📊 Analytics Dashboard** | Streamlit Interactive Cloud Dashboard       | [weather-data-pipeline.streamlit.app](https://weather-data-pipeline-2tnainwikjfawai76ekqqn.streamlit.app) |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Ingestion ["1. Data Ingestion & Validation"]
        API["Open-Meteo REST API"] --> Ingest["weather_api.py"]
        Ingest --> Raw["data/raw/*.json"]
        Raw --> Transform["transform_weather.py"]
        Transform --> Validate["validate_weather.py"]
    end

    subgraph FeatureEng ["2. Feature Engineering & ML"]
        Validate --> Features["feature_engineering.py<br/>advanced_features.py"]
        Features --> CleanCSV["data/process/*.csv"]
        CleanCSV --> MLTrain["train_model.py<br/>(Random Forest Regressor)"]
        MLTrain --> ModelPKL["models/*.pkl"]
        ModelPKL --> MLPredict["predict_weather.py"]
        MLPredict --> PredCSV["weather_predictions.csv"]
    end

    subgraph Storage ["3. Modern Data Stack Storage"]
        Validate --> SQLite[("SQLite OLTP<br/>(weather.db)")]
        CleanCSV --> DuckDB[("DuckDB OLAP<br/>(weather_olap.duckdb)")]
        CleanCSV --> Parquet[("Columnar Parquet<br/>(data/parquet)")]
    end

    subgraph Orchestration ["4. Orchestration & Monitoring"]
        Airflow["Apache Airflow DAG<br/>(Daily 06:00 AM)"] -.-> Ingestion
        Airflow -.-> FeatureEng
        Airflow -.-> Storage
        CleanCSV --> Telegram["Telegram Bot Alerts<br/>(Daily Morning Summary)"]
        Cron["GitHub Actions Cron<br/>(Daily 07:00 AM Cloud)"] -.-> Telegram
    end

    subgraph Delivery ["5. Data Serving & User Applications"]
        SQLite & PredCSV --> FastAPI["FastAPI REST API<br/>(Deployed on Render)"]
        CleanCSV & PredCSV --> Streamlit["Streamlit Analytics Dashboard<br/>(Deployed on Streamlit Cloud)"]
        FastAPI --> ReactPWA["React 19 PWA Web App<br/>(Deployed on Vercel)"]
    end

    classDef ing fill:#e1f5fe,stroke:#0288d1,stroke-width:1.5px;
    classDef fe fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1.5px;
    classDef stor fill:#e8f5e9,stroke:#388e3c,stroke-width:1.5px;
    classDef orch fill:#fff3e0,stroke:#f57c00,stroke-width:1.5px;
    classDef deliv fill:#fce4ec,stroke:#c2185b,stroke-width:1.5px;

    class API,Ingest,Raw,Transform,Validate ing;
    class Features,CleanCSV,MLTrain,ModelPKL,MLPredict,PredCSV fe;
    class SQLite,DuckDB,Parquet stor;
    class Airflow,Telegram,Cron orch;
    class FastAPI,Streamlit,ReactPWA deliv;
```

# 🌦️ End-to-End Weather Data Pipeline & AI Forecasting Platform

[![Python CI Pipeline](https://github.com/QuangHuy-68/weather-data-pipeline/actions/workflows/ci.yml/badge.svg)](https://github.com/QuangHuy-68/weather-data-pipeline/actions)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://weather-data-pipeline-er66.onrender.com/docs)
[![React PWA](https://img.shields.io/badge/React-19_PWA-61DAFB.svg?logo=react&logoColor=black)](https://weather-data-pipeline-one.vercel.app)
[![Streamlit](https://img.shields.io/badge/Streamlit-Cloud-FF4B4B.svg?logo=streamlit&logoColor=white)](https://weather-data-pipeline-2tnainwikjfawai76ekqqn.streamlit.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade, end-to-end Data Engineering & Machine Learning pipeline that ingests real-time hourly meteorological data, validates data quality, persists across OLTP (SQLite) and OLAP (DuckDB + Parquet) storage, predicts future temperatures using Random Forest regression, orchestrates workflows via Apache Airflow, and serves insights through a FastAPI REST API, a Streamlit analytics dashboard, and an installable React PWA.

---

## 🌐 Live Demonstrations

| Platform                         | Type                                        | URL                                                                                                      |
| :------------------------------- | :------------------------------------------ | :------------------------------------------------------------------------------------------------------- |
| **📱 Mobile PWA App**      | Progressive Web App (React 19, TailwindCSS) | [weather-data-pipeline-one.vercel.app](https://weather-data-pipeline-one.vercel.app)                      |
| **⚡ Production API**      | FastAPI REST API + Interactive Swagger UI   | [weather-data-pipeline-er66.onrender.com/docs](https://weather-data-pipeline-er66.onrender.com/docs)      |
| **📊 Analytics Dashboard** | Streamlit Interactive Cloud Dashboard       | [weather-data-pipeline.streamlit.app](https://weather-data-pipeline-2tnainwikjfawai76ekqqn.streamlit.app) |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Ingestion ["1. Data Ingestion & Validation"]
        API["Open-Meteo REST API"] --> Ingest["weather_api.py"]
        Ingest --> Raw["data/raw/*.json"]
        Raw --> Transform["transform_weather.py"]
        Transform --> Validate["validate_weather.py"]
    end

    subgraph FeatureEng ["2. Feature Engineering & ML"]
        Validate --> Features["feature_engineering.py<br/>advanced_features.py"]
        Features --> CleanCSV["data/process/*.csv"]
        CleanCSV --> MLTrain["train_model.py<br/>(Random Forest Regressor)"]
        MLTrain --> ModelPKL["models/*.pkl"]
        ModelPKL --> MLPredict["predict_weather.py"]
        MLPredict --> PredCSV["weather_predictions.csv"]
    end

    subgraph Storage ["3. Modern Data Stack Storage"]
        Validate --> SQLite[("SQLite OLTP<br/>(weather.db)")]
        CleanCSV --> DuckDB[("DuckDB OLAP<br/>(weather_olap.duckdb)")]
        CleanCSV --> Parquet[("Columnar Parquet<br/>(data/parquet)")]
    end

    subgraph Orchestration ["4. Orchestration & Monitoring"]
        Airflow["Apache Airflow DAG<br/>(Daily 06:00 AM)"] -.-> Ingestion
        Airflow -.-> FeatureEng
        Airflow -.-> Storage
        CleanCSV --> Telegram["Telegram Bot Alerts<br/>(Daily Morning Summary)"]
        Cron["GitHub Actions Cron<br/>(Daily 07:00 AM Cloud)"] -.-> Telegram
    end

    subgraph Delivery ["5. Data Serving & User Applications"]
        SQLite & PredCSV --> FastAPI["FastAPI REST API<br/>(Deployed on Render)"]
        CleanCSV & PredCSV --> Streamlit["Streamlit Analytics Dashboard<br/>(Deployed on Streamlit Cloud)"]
        FastAPI --> ReactPWA["React 19 PWA Web App<br/>(Deployed on Vercel)"]
    end

    classDef ing fill:#e1f5fe,stroke:#0288d1,stroke-width:1.5px;
    classDef fe fill:#f3e5f5,stroke:#7b1fa2,stroke-width:1.5px;
    classDef stor fill:#e8f5e9,stroke:#388e3c,stroke-width:1.5px;
    classDef orch fill:#fff3e0,stroke:#f57c00,stroke-width:1.5px;
    classDef deliv fill:#fce4ec,stroke:#c2185b,stroke-width:1.5px;

    class API,Ingest,Raw,Transform,Validate ing;
    class Features,CleanCSV,MLTrain,ModelPKL,MLPredict,PredCSV fe;
    class SQLite,DuckDB,Parquet stor;
    class Airflow,Telegram,Cron orch;
    class FastAPI,Streamlit,ReactPWA deliv;
```
