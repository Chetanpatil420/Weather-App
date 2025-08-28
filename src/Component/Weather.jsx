import { useState } from "react";
import "./Weather.css";// css file

export default function WeatherApp() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bgClass, setBgClass] = useState("bg-default");
  const [inputError, setInputError] = useState(false);

  const fetchWeather = async () => {
    console.log("⚡ fetchWeather called with city:", city);

    if (!city.trim()) {
      console.warn("❌ No city entered");
      setInputError(true);
      return;
    }
    setInputError(false);

    // Cache
    const cached = localStorage.getItem(city.toLowerCase());
    if (cached) {
      console.log("📦 Using cached data for", city);
      setWeather(JSON.parse(cached));
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      console.log("🌍 Fetching geocoding data...");
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
      );
      const geoData = await geoRes.json();
      console.log("🌍 Geo Response:", geoData);

      if (!geoData.results || geoData.results.length === 0) {
        console.error("❌ City not found in geocoding");
        setError("City not found");
        setLoading(false);
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];
      console.log("✅ Coordinates:", latitude, longitude);

      console.log("🌦 Fetching weather data...");
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,snowfall,snow_depth,apparent_temperature,precipitation_probability,precipitation,pressure_msl,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,evapotranspiration,et0_fao_evapotranspiration,vapour_pressure_deficit&current_weather=true&timezone=auto`
      );
      const weatherData = await weatherRes.json();
      console.log("🌦 Weather API Response:", weatherData);

      if (!weatherData.current_weather) {
        console.error(" No current_weather in API response");
        setError("Weather data not available for this city");
        setLoading(false);
        return;
      }

      // ✅ Background
      const code = weatherData.current_weather.weathercode;
      const currentTime = new Date(weatherData.current_weather.time);
      const hour = currentTime.getHours();

      if (hour >= 18 || hour < 6) {
        setBgClass("bg-night");
      } else if (code === 0) {
        setBgClass("bg-sunny");
      } else {
        setBgClass("bg-rainy");
      }

      // ✅ Find nearest hour
      let hourIndex = 0;
      let minDiff = Infinity;
      weatherData.hourly.time.forEach((t, idx) => {
        const diff = Math.abs(new Date(t) - currentTime);
        if (diff < minDiff) {
          minDiff = diff;
          hourIndex = idx;
        }
      });
      console.log(" Matched Hourly Time:", weatherData.hourly.time[hourIndex]);

      // ✅ Build result safely
      const result = {
        city: `${name}, ${country}`,
        temperature: weatherData.current_weather.temperature,
        windspeed: weatherData.current_weather.windspeed,
        humidity: weatherData.hourly.relative_humidity_2m?.[hourIndex] ?? "N/A",
        dewPoint: weatherData.hourly.dew_point_2m?.[hourIndex] ?? "N/A",
        pressure: weatherData.hourly.pressure_msl?.[hourIndex] ?? "N/A",
        surfacePressure: weatherData.hourly.surface_pressure?.[hourIndex] ?? "N/A",
        clouds: weatherData.hourly.cloud_cover?.[hourIndex] ?? "N/A",
        visibility: weatherData.hourly.visibility?.[hourIndex] ?? "N/A",
        precipitation: weatherData.hourly.precipitation?.[hourIndex] ?? "N/A",
      };

      console.log("✅ Final Parsed Result:", result);

      localStorage.setItem(city.toLowerCase(), JSON.stringify(result));
      setWeather(result);
    } catch (err) {
      console.error("FetchWeather crashed:", err);
      setError("Failed to fetch weather");
    }
    setLoading(false);
  };

  return (
    <div className={`weather-container ${bgClass}`}>
      <h1 className="weather-title">🌦 Weather Now</h1>

      <div className="search-input">
        <input
          type="text"
          placeholder="Enter city name..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={`form-control mb-2 ${inputError ? "input-error" : ""}`}
        />
        {inputError && <p className="error-text">Enter the city</p>}
        <button onClick={fetchWeather} className="btn search-button w-100">
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {weather && (
        <div className="weather-card fade-in">
          <h2>{weather.city}</h2>
          <p>🌡temperature {weather.temperature}°C (Now)</p>
          <p>💨 windspeed {weather.windspeed} km/h wind</p>

          <h3>🌍 Extra Weather Details</h3>
          <p>💧 Humidity: {weather.humidity}%</p>
          <p>🌫 Dew Point: {weather.dewPoint}°C</p>
          <p>📉 Pressure: {weather.pressure} hPa</p>
          <p>📉 Surface Pressure: {weather.surfacePressure} hPa</p>
          <p>☁ Cloud Cover: {weather.clouds}%</p>
          <p>👁 Visibility: {weather.visibility} m</p>
          <p>🌧 Precipitation: {weather.precipitation} mm</p>
        </div>
      )}
    </div>
  );
}
