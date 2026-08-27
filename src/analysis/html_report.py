import logging
from datetime import datetime
from pathlib import Path

import pandas as pd

from config.config import DAILY_SUMMARY_FILE, CHART_DIR

logger= logging.getLogger(__name__)

def generate_html_report() -> Path: 

    # 1. Load Data
    df = pd.read_csv(DAILY_SUMMARY_FILE)

    # 2. Create HTML table
    table_html = df.to_html(
        index=False,
        float_format="%.1f",
        classes="weather-table"
    )

    # 3. Read charts
    chart_dir = Path(CHART_DIR)

    # 4. Create HTML
    report_date = datetime.now().strftime("%Y-%m-%d %H:%M")

    html = f"""<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Weather Report = {report_date}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 20px;
                    background: #f5f5f5;
                }}

                h1{{
                    color: #2c3e50;
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 10px;
                }}

                h2{{
                    color: #2980b9;
                    margin-top: 30px;
                }}

                .weather-table {{
                    width: 100%;
                    border-cllapse: collapse;
                    margin: 20px 0;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}

                .weather-table th {{
                    background: #3498db;
                    color: white;
                    padding: 12px;
                    text-align: left;
                }}

                .weather-table td {{
                    padding: 10px 12px;
                    border-bottom: 1px solid #eee;
                }}

                .weather-table tr:hover {{
                    background: #f0f8ff;
                }}

                .chart-container {{
                    background: white;
                    padding: 15px;
                    margin; 15px 0;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                }}

                .chart-container img {{
                    max-width: 100%;
                    height: auto;
                }}

                .footer {{
                    text-align: center;
                    color: #888;
                    margin-top: 40px;
                    font-size: 0.9em;
                }}
            </style>
        </head>
        <body>
        
        <h1>🌦️ Weather Report</h1>
        <p>Generated: {report_date}</p>

        <h2>📊 Daily Summary</h2>
        {table_html}

        <h2>📈 Charts</h2>
        <div class="chart-container">
            <h3>Temperature</h3>
            <img src="../{chart_dir}/daily_temperature.png" alt="Temperature">
        </div>

        <div class="chart-container">
            <h3>Precipitation</h3>
            <img src="../{chart_dir}/daily_precipitation.png" alt="Precipitation">
        </div>

        <div class="footer">
            <p>Weather Data Pipeline - Auto-generated report</p>
        </div>

        </body>
        </html>"""

    # 5. save
    report_dir = Path("reports")
    report_dir.mkdir(parents=True,exist_ok=True)

    output_file = report_dir / f"weather_report_{datetime.now().strftime('%Y%m%d')}.html"
    output_file.write_text(html,encoding="utf-8")

    logger.info(f"HTML report saved to: {output_file}")
    print(f"📄 HTML report saved to: {output_file}")

    return output_file

if __name__ == "__main__":
    generate_html_report()