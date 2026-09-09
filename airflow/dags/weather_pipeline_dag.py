import sys 
import logging

from pathlib import Path
from datetime import datetime, timedelta
from airflow import DAG
from airflow.providers.standard.operators.python import PythonOperator
from airflow.providers.standard.operators.empty import EmptyOperator

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

logger = logging.getLogger(__name__)


default_args = {
    "owner": "quanghuy",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=5)
}


def task_fetch_weather_api():
    from src.ingestion.weather_api import fetch_weather
    logger.info("🌐 Starting data collection from the API...")
    fetch_weather()
    logger.info("✅ API data collection completed.")

def task_transform_data(): 
    from src.transformation.transform_weather import transform_weather
    logger.info("🔄 Starting data conversion...")
    transform_weather()
    logger.info("✅ Data migration completed.")

def task_validate_data(): 
    from src.validation.validate_weather import validate_weather
    logger.info("🔍 Starting data quality check...")
    validate_weather()
    logger.info("✅ Data verification completed.")

def task_feature_engineering():
    from src.transformation.feature_engineering import engineer_features
    logger.info("⚙️ Starting data feature engineering...")
    engineer_features()
    logger.info("✅ Feature creation completed.")

def task_prepare_final_dataset():
    from src.transformation.prepare_final_dataset import prepare_final_dataset
    logger.info("📦 Preparing the final dataset...")
    prepare_final_dataset()
    logger.info("✅ Dataset preparation complete.")

def task_store_to_database(): 
    from src.storage.database import  store_to_database
    logger.info("🗄️ Saving data to SQLite...")
    store_to_database()
    logger.info("✅ Database save completed.")

def task_export_to_duckdb():
    from src.storage.duckdb_storage import export_to_parquet_and_duckdb
    logger.info("🦆 Exporting to DuckDB & Parquet...")
    export_to_parquet_and_duckdb()
    logger.info("✅ DuckDB export completed.")

def task_training_ml_model():
    from src.ml.train_model import train_weather_model
    logger.info("🤖 Training ML model...")
    train_weather_model()
    logger.info("✅ ML training completed.")

def task_predict_weather(): 
    from src.ml.predict_weather import predict_future_temperature
    logger.info("🔮 Forecasting temperature...")
    predict_future_temperature()
    logger.info("✅ Forecasting completed.")

def task_send_telegram_alert(): 
    from src.notifications.telegram_alert import send_telegram_message
    logger.info("📱 Sending Telegram report...")
    send_telegram_message()
    logger.info("✅ Telegram report sent.")



with DAG(
    dag_id="weather_data_pipeline",
    description="Collect, process, and store data; perform ML-based forecasting; and send automated daily weather alerts.",
    default_args=default_args,
    schedule="0 6 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["weather","etl", "ml"],
) as dag:

    start = EmptyOperator(task_id="start")

    t1_fetch = PythonOperator(task_id="fetch_weather_api", python_callable=task_fetch_weather_api,)
    t2_transform = PythonOperator(task_id="transform_data", python_callable=task_transform_data,)
    t3_validate = PythonOperator(task_id="validate_data", python_callable=task_validate_data,)
    t4_features = PythonOperator(task_id="feature_engineering", python_callable=task_feature_engineering,)
    t5_final = PythonOperator(task_id="prepare_final_dataset", python_callable=task_prepare_final_dataset,)
    t6_database = PythonOperator(task_id="store_to_database", python_callable=task_store_to_database,)
    t7_duckdb = PythonOperator(task_id="export_to_duckdb", python_callable=task_export_to_duckdb,)
    t8_ml_train = PythonOperator(task_id="train_ml_model", python_callable=task_training_ml_model,)
    t9_ml_predict = PythonOperator(task_id="predict_weather", python_callable=task_predict_weather,)
    t10_alert = PythonOperator(task_id="send_telegram_alert", python_callable=task_send_telegram_alert,)

    end = EmptyOperator(task_id="end")

    (
        start
        >> t1_fetch
        >> t2_transform
        >> t3_validate
        >> t4_features
        >> t5_final
        >> [t6_database, t7_duckdb]
        >> t8_ml_train
        >> t9_ml_predict
        >> t10_alert
        >> end
    )