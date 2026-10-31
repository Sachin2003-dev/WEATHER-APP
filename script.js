// Weather App using Open-Meteo (free, no API key needed).
// Step 1: Geocoding API  -> converts a city name into latitude/longitude.
// Step 2: Forecast API   -> returns current weather for those coordinates.

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// Open-Meteo returns a numeric WMO weather code; map it to readable text.
const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rainy",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

// DOM elements
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const button = document.getElementById("get-weather");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const cityEl = document.getElementById("city");
const tempEl = document.getElementById("temp");
const conditionEl = document.getElementById("condition");

// Custom error so we can show a friendly message for "city not found".
class CityNotFoundError extends Error {}

// Helper: fetch a URL and return parsed JSON, throwing if the HTTP status is bad.
async function fetchJSON(url) {
  const response = await fetch(url); // returns a Promise; await pauses until it resolves
  if (!response.ok) {
    // fetch() does NOT throw on 404/500, so we check response.ok ourselves
    throw new Error(`Request failed with status ${response.status}`);
  }
  return await response.json(); // parsing JSON is also asynchronous
}

// Main async function
async function getWeather(city) {
  // 1. Convert city name to coordinates
  const geoData = await fetchJSON(
    `${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );

  // When nothing matches, the API omits "results" entirely
  if (!geoData.results || geoData.results.length === 0) {
    throw new CityNotFoundError(city);
  }

  const { name, admin1, country, latitude, longitude } = geoData.results[0];

  // 2. Fetch the current weather for those coordinates
  const weatherData = await fetchJSON(
    `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,weather_code&timezone=auto`
  );

  const current = weatherData.current;

  return {
    location: [name, admin1, country].filter(Boolean).join(", "),
    temperature: Math.round(current.temperature_2m),
    condition: WEATHER_CODES[current.weather_code] || "Unknown",
  };
}

function showWeather(data) {
  cityEl.textContent = data.location;
  tempEl.textContent = `${data.temperature}°C`;
  conditionEl.textContent = data.condition;
  resultEl.hidden = false;
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

// Event handling: runs when the button is clicked or Enter is pressed
form.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop the page from reloading

  const city = cityInput.value.trim();
  if (!city) {
    resultEl.hidden = true;
    setStatus("Please enter a city name.", true);
    return;
  }

  resultEl.hidden = true;
  setStatus("Loading weather…");
  button.disabled = true;

  try {
    const data = await getWeather(city);
    setStatus("");
    showWeather(data);
  } catch (error) {
    if (error instanceof CityNotFoundError) {
      setStatus(`Could not find "${city}". Check the spelling and try again.`, true);
    } else {
      // Network down, API unavailable, bad response, etc.
      setStatus("Could not get weather data. Check your internet connection and try again.", true);
    }
    console.error(error);
  } finally {
    button.disabled = false; // always re-enable the button
  }
});
