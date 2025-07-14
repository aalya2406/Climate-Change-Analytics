let text = document.getElementById('text');
let leaf = document.getElementById('leaf');
let hill1 = document.getElementById('hill1');
let hill4 = document.getElementById('hill4');
let hill5 = document.getElementById('hill5');

window.addEventListener('scroll', () => {
    let value = window.scrollY;

    text.style.marginTop = value * 2.5 + 'px';
    leaf.style.top = value * -1.5 + 'px';
    leaf.style.left = value * 1.5 + 'px';
    hill5.style.left = value * 1.5 + 'px';
    hill4.style.left = value * -1.5 + 'px';
    hill1.style.top = value * 1 + 'px';

    
})

// Climate Chart Setup
let ctx = document.getElementById('climateChart').getContext('2d');
let climateChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Dates or years
        datasets: [{
            label: 'Loading...',
            data: [],
            backgroundColor: 'rgba(53,147,129,0.2)',
            borderColor: '#359381',
            borderWidth: 2,
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: { display: true, title: { display: true, text: 'Year' }},
            y: { display: true, title: { display: true, text: 'Value' }}
        }
    }
});


async function fetchTemperatureData() {
    try {
        const response = await fetch(
  'https://climate-api.open-meteo.com/v1/climate?latitude=52.52&longitude=13.41&start_date=2020-01-01&end_date=2022-12-31&model=CMCC_CM2_VHR4&daily=temperature_2m_max'
);

        const data = await response.json();
        console.log("API data:", data);

        if (!data.daily || !data.daily.time || !data.daily.temperature_2m_max) {
            throw new Error("Unexpected API response format");
        }

        // Slice to recent data (last 365 points)
        const dates = data.daily.time.slice(-365);
        const temps = data.daily.temperature_2m_max.slice(-365);

        climateChart.data.labels = dates;
        climateChart.data.datasets[0].label = "Max Daily Temperature (°C)";
        climateChart.data.datasets[0].data = temps;
        climateChart.update();
    } catch (error) {
        console.error("Error fetching temperature data:", error);
    }
}

// 🧠 Mock Data for Other Metrics (like CO2 or Sea Level)
const mockClimateData = {
    co2: {
        label: "Atmospheric CO₂ (ppm)",
        labels: ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"],
        data: [400, 403, 405, 407, 410, 412, 414, 416, 419]
    },
    sea: {
        label: "Global Sea Level Rise (mm)",
        labels: ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"],
        data: [0, 3, 6, 9, 12, 15, 18, 21, 24]
    }
};

// Update Chart Based on Dropdown Selection
function updateClimateChart(metric) {
    if (metric === 'temperature') {
        fetchTemperatureData();
    } else {
        const selected = mockClimateData[metric];
        climateChart.data.labels = selected.labels;
        climateChart.data.datasets[0].label = selected.label;
        climateChart.data.datasets[0].data = selected.data;
        climateChart.update();
    }
}

// Get Dropdown Reference
const metricSelector = document.getElementById('climateMetric');

// Event Listener for Dropdown
metricSelector.addEventListener('change', () => {
    updateClimateChart(metricSelector.value);
});

//  Load Temperature on Page Start
updateClimateChart('temperature');

// 🌍 Location-based data loading
document.getElementById('loadData').addEventListener('click', () => {
  const locationInput = document.getElementById('location').value.trim();
  const [lat, lng] = locationInput.split(',').map(Number);
  const selectedMetric = document.getElementById('climateMetric').value;

  if (!locationInput || isNaN(lat) || isNaN(lng)) {
    alert("Enter valid coordinates (e.g. 40.71,-74.01)");
    return;
  }

  if (selectedMetric === 'temperature') {
    fetchTemperatureDataByCoords(lat, lng);
  } else if (selectedMetric === 'co2') {
    fetchCO2DataByCoords(lat, lng);
  } else if (selectedMetric === 'sea') {
    fetchSeaLevelDataByCoords(lat, lng);
  }
});


async function fetchTemperatureDataByCoords(lat, lng) {
  try {
    const url = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lng}&start_date=2020-01-01&end_date=2022-12-31&model=CMCC_CM2_VHR4&daily=temperature_2m_max`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Location-based API data:", data);

    if (!data.daily || !data.daily.time || !data.daily.temperature_2m_max) {
      throw new Error("Unexpected API response format");
    }

    const dates = data.daily.time;
    const temps = data.daily.temperature_2m_max;

    climateChart.data.labels = dates;
    climateChart.data.datasets[0].label = `Max Temp (°C) @ ${lat},${lng}`;
    climateChart.data.datasets[0].data = temps;
    climateChart.update();
  } catch (error) {
    console.error("Error fetching location data:", error);
    alert("Could not load data for that location.");
  }
}

async function fetchCO2DataByCoords(lat, lng) {
  try {
    const url = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lng}&start_date=2015-01-01&end_date=2023-12-31&model=EC_Earth3P_HR&yearly=co2`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("CO2 data:", data);

    if (!data.yearly?.time || !data.yearly?.co2) {
      throw new Error("Unexpected CO₂ response format");
    }

    climateChart.data.labels = data.yearly.time;
    climateChart.data.datasets[0].label = `CO₂ (ppm) @ ${lat},${lng}`;
    climateChart.data.datasets[0].data = data.yearly.co2;
    climateChart.update();
  } catch (error) {
    console.error("CO₂ error:", error);
    alert("Could not load CO₂ data.");
  }
}

async function fetchSeaLevelDataByCoords(lat, lng) {
  try {
    const url = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lng}&start_date=2000-01-01&end_date=2022-12-31&model=MPI_ESM1_2_XR&yearly=sea_level`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Sea level data:", data);

    if (!data.yearly?.time || !data.yearly?.sea_level) {
      throw new Error("Unexpected sea level format");
    }

    climateChart.data.labels = data.yearly.time;
    climateChart.data.datasets[0].label = `Sea Level (mm) @ ${lat},${lng}`;
    climateChart.data.datasets[0].data = data.yearly.sea_level;
    climateChart.update();
  } catch (error) {
    console.error("Sea level error:", error);
    alert("Could not load sea level data.");
  }
}

async function fetchTemperatureForecast(lat, lng) {
  try {
    const url = `http://localhost:5000/api/forecast/${lat}/${lng}`;
    const response = await fetch(url);
    const data = await response.json();

    climateChart.data.labels = data.future_dates;
    climateChart.data.datasets[0].label = `Forecast Temp (°C) @ ${lat},${lng}`;
    climateChart.data.datasets[0].data = data.forecast;
    climateChart.update();
  } catch (err) {
    console.error("Forecast error:", err);
    alert("Could not generate forecast.");
  }
}

document.getElementById('forecastBtn').addEventListener('click', () => {
  const locationInput = document.getElementById('location').value.trim();
  const [lat, lng] = locationInput.split(',').map(Number);

  if (!locationInput || isNaN(lat) || isNaN(lng)) {
    alert("Enter valid coordinates (e.g. 40.71,-74.01)");
    return;
  }

  fetchTemperatureForecast(lat, lng);
});

