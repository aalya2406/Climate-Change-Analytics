from flask import Flask, jsonify
import openmeteo_requests
import pandas as pd
import requests_cache
from retry_requests import retry
from flask_cors import CORS  # Important for local frontend/backend setup

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Setup Open-Meteo client
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
client = openmeteo_requests.Client(session=retry_session)

@app.route("/api/climate-data")
def get_climate_data():
    url = "https://climate-api.open-meteo.com/v1/climate"
    params = {
        "latitude": 52.52,
        "longitude": 13.41,
        "start_date": "1950-01-01",
        "end_date": "2050-12-31",
        "models": [
            "CMCC_CM2_VHR4", "FGOALS_f3_H", "HiRAM_SIT_HR",
            "MRI_AGCM3_2_S", "EC_Earth3P_HR", "MPI_ESM1_2_XR", "NICAM16_8S"
        ],
        "daily": "temperature_2m_max"
    }

    responses = client.weather_api(url, params=params)
    response = responses[0]
    daily = response.Daily()

    # Convert to DataFrame
    dates = pd.date_range(
        start=pd.to_datetime(daily.Time(), unit="s", utc=True),
        end=pd.to_datetime(daily.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=daily.Interval()),
        inclusive="left"
    )
    temps = daily.Variables(0).ValuesAsNumpy()

    return jsonify({
        "dates": dates.strftime("%Y-%m-%d").tolist(),
        "temperature_2m_max": temps.tolist()
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)

@app.route("/api/forecast/<float:lat>/<float:lng>")
def forecast_temperature(lat, lng):
    url = "https://climate-api.open-meteo.com/v1/climate"
    params = {
        "latitude": lat,
        "longitude": lng,
        "start_date": "2010-01-01",
        "end_date": "2023-12-31",
        "model": "CMCC_CM2_VHR4",
        "daily": "temperature_2m_max"
    }

    responses = client.weather_api(url, params=params)
    response = responses[0]
    daily = response.Daily()

    dates = pd.date_range(
        start=pd.to_datetime(daily.Time(), unit="s", utc=True),
        end=pd.to_datetime(daily.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=daily.Interval()),
        inclusive="left"
    )
    temps = pd.Series(daily.Variables(0).ValuesAsNumpy(), index=dates)

    # Optional: smooth or resample (e.g., monthly average)
    temps = temps.resample("M").mean()

    # Forecasting with ARIMA or Prophet
    from statsmodels.tsa.arima.model import ARIMA
    model = ARIMA(temps, order=(5, 1, 0))
    fitted = model.fit()
    forecast = fitted.forecast(steps=12)

    return jsonify({
        "future_dates": [d.strftime("%Y-%m-%d") for d in forecast.index],
        "forecast": forecast.tolist()
    })
