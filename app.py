import sqlite3
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from pathlib import Path
from config.config import DB_PATH, DAILY_SUMMARY_FILE

# ==========================================
# 1. Configure Streamlit
# ==========================================

st.set_page_config(
    page_title="Weather Data Analytics",
    page_icon="🌦️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==========================================
# 2. function read data from Database & CSV
# ==========================================

@st.cache_data(ttl=600) # Cache 10 min
def load_data():

    if not Path(DB_PATH).exists():
        return None, None

    with sqlite3.connect(DB_PATH) as conn:
        query = """
            
                SELECT 
                    w.time,
                    l.location_name,
                    w.temperature,
                    w.humidity,
                    w.wind_speed,
                    w.precipitation
                FROM weather_data w
                JOIN weather_location l ON w.location_id = l.id
                ORDER BY w.time
                """

        df_hourly = pd.read_sql_query(query, conn)
        df_hourly["time"] = pd.to_datetime(df_hourly["time"])

        df_daily = pd.DataFrame()

        if Path(DAILY_SUMMARY_FILE).exists():
            df_daily = pd.read_csv(DAILY_SUMMARY_FILE)
            df_daily["date"] = pd.to_datetime(df_daily["date"])

        return df_hourly, df_daily

df_hourly, df_daily = load_data()

# ==========================================
# 3. Sidebar: data filter
# ==========================================
st.sidebar.header("⚙️ Bộ lọc dữ liệu")

if df_hourly is None or df_hourly.empty: 
    st.error("⚠️ No weather data in the database. Please run `python pipeline.py` first!")

    st.stop()

locations = df_hourly["location_name"].unique().tolist()
selected_location = st.sidebar.selectbox("📍 Choose location:", locations)


df_filtered = df_hourly[df_hourly["location_name"] == selected_location].copy()


min_date = df_filtered["time"].min().date()
max_date = df_filtered["time"].max().date()

date_range = st.sidebar.date_input(
    "📅 Choose time range:", 
    value=(min_date, max_date), 
    min_value=min_date,
    max_value=max_date
)


if len(date_range) == 2: 
    start_date, end_date = date_range
    mask = (df_filtered["time"].dt.date >= start_date) & (df_filtered["time"].dt.date <= end_date)
    df_filtered = df_filtered.loc[mask]

st.title("🌦️ Weather Analytics Dashboard")
st.caption(f"Weather data automatically updated from Open-Meteo API | Location: **{selected_location}**")

st.markdown("---")

st.subheader("📌 Key indicators overview")

col1, col2, col3, col4 = st.columns(4)

with col1: 
    avg_temp = df_filtered["temperature"].mean()
    max_temp = df_filtered["temperature"].max()
    st.metric(
        label="🌡️ Average Temperature (maximum)",
        value=f"{avg_temp:.1f} °C",
        delta=f"Max {max_temp:.1f} °C"
    )

with col2:
    avg_hum = df_filtered["humidity"].mean()
    st.metric(
        label="💧 Average humidity",
        value=f"{avg_hum:.1f} %"
    )

with col3: 
    max_wind = df_filtered["wind_speed"].max()
    st.metric(
        label="💨 Maximum wind speed",
        value=f"{max_wind:.1f} km/h"
    )

with col4:
    total_rain = df_filtered["precipitation"].sum()
    rain_hours = (df_filtered["precipitation"] > 0).sum()
    st.metric(
        label="🌧️ Total precipitation",
        value=f"{total_rain:.1f} mm",
        delta=f"{rain_hours} rainy hours"
    )

st.markdown("---")


# Interactive Charts
st.subheader("📈 Weather trend analysis")

tab1, tab2, tab3 = st.tabs(["🌡️ Temperature and Humidity", "🌧️ Precipitation", "💨 Wind"])

with tab1: 
    fig_temp = go.Figure()
    
    # 1. Đường Nhiệt độ (Trục Y bên trái)
    fig_temp.add_trace(go.Scatter(
        x=df_filtered["time"],
        y=df_filtered["temperature"],
        mode="lines+markers",
        name="Temperature (°C)",
        line=dict(color="#e74c3c", width=2)
    ))

    # 2. Đường Độ ẩm (Trục Y bên phải)
    fig_temp.add_trace(go.Scatter(
        x=df_filtered["time"],
        y=df_filtered["humidity"],
        mode="lines",
        name="Humidity (%)",
        line=dict(color="#3498db", width=2, dash="dot"),
        yaxis="y2"
    ))

    fig_temp.update_layout(
        title="Temperature and Humidity Variations Over Time",
        xaxis_title="Time",
        yaxis=dict(title="Temperature (°C)", title_font=dict(color="#e74c3c")),
        yaxis2=dict(title="Humidity (%)", title_font=dict(color="#3498db"), overlaying="y", side="right"),
        hovermode="x unified", 
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    )

    st.plotly_chart(fig_temp, width="stretch")

with tab2: 
    fig_rain=px.bar(
        df_filtered,
        x="time",
        y="precipitation",
        title="Hourly rainfall (mm)",
        labels={"precipitation": "Rain fall (mm)", "time": "Time"},
        color="precipitation",
        color_continuous_scale="blues"
    )

    st.plotly_chart(fig_rain, width="stretch")

with tab3: 
    fig_wind = px.area(
        df_filtered,
        x="time",
        y="wind_speed",
        title="Wind speed over time (km/h)",
        labels={"wind_speed": "Wind Speed (km/h)", "time": "Time"},
        color_discrete_sequence=["#2ecc71"]
    )
    st.plotly_chart(fig_wind, width="stretch")


st.markdown("---")
st.subheader("📋 Detail Data")
with st.expander("🔍 View the filtered data table"): 
    st.dataframe(df_filtered, width="stretch")

    csv_data = df_filtered.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Download this data (.csv)",
        data=csv_data,
        file_name=f"weather_export_{selected_location}.csv",
        mime="text/csv"
    )


