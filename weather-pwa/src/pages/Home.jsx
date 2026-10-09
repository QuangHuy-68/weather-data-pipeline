import { useState, useEffect, useRef } from "react"
import { useWeatherCurrent, useWeatherDaily, useWeatherHourly, useAirQuality } from "../hooks/useWeather"
import { useTheme } from "../context/ThemeContext"
import { useGeolocation } from "../hooks/useGeolocation"
import { useNotification } from "../hooks/useNotification"
import CitySelector from "../components/CitySelector"
import HourlyForecast from "../components/HourlyForecast"
import AirQualityCard from "../components/AirQualityCard"
import ChatAssistant from "../components/ChatAssistant"
import WeatherRadar from "../components/WeatherRadar"
import {
    AreaChart, 
    Area,
    BarChart, 
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

export default function Home() {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    // 1. Location state management (with localStorage persistence)
    const [selectedCity, setSelectedCity] = useState(() => {
        return localStorage.getItem("weather_selected_city") || "HCM"
    })
    const [customLocation, setCustomLocation] = useState(() => {
        try {
            const saved = localStorage.getItem("weather_custom_location")
            return saved ? JSON.parse(saved) : null
        } catch {
            return null
        }
    })

    const [isGPSActive, setIsGPSActive] = useState(false)

    // 2. GPS Geolocation Hook
    const { 
        coords, 
        loading: loadingGPS, 
        error: gpsError, 
        getLocation, 
        clearCoords 
    } = useGeolocation()

    // 3. Web Push Notification Hook
    const { permission, requestPermission, sendNotification } = useNotification()
    const lastAlertKey = useRef("")

    const isUsingGPS = isGPSActive && coords?.lat != null && coords?.lon != null

    // Determine active target coordinates and location name
    const activeLat = isUsingGPS ? coords.lat : customLocation ? customLocation.lat : null
    const activeLon = isUsingGPS ? coords.lon : customLocation ? customLocation.lon : null
    const activeCityId = (isUsingGPS || customLocation) ? null : selectedCity
    const activeName = isUsingGPS ? "Your GPS Location" : customLocation ? 
    `${customLocation.name}${customLocation.country ? `, ${customLocation.country}` : ''}` : null

    // 4. Fetch weather data by selected city or GPS coordinates
    const { 
        data: current,
        loading: loadingCurrent,
        error: currentError 
    } = useWeatherCurrent({
        city: activeCityId,
        lat: activeLat,
        lon: activeLon,
        name: activeName
    })

    const { 
        data: daily,
        loading: loadingDaily 
    } = useWeatherDaily({
        limit: 7,
        city: activeCityId,
        lat: activeLat,
        lon: activeLon
    })

    // 5. Fetch 24-hour hourly forecast timeline
    const { 
        data: hourly,
        loading: loadingHourly 
    } = useWeatherHourly({
        city: activeCityId,
        lat: activeLat,
        lon: activeLon
    })

    // 6. Fetch Air Quality Index (AQI & PM2.5)
    const {
        data: aqiData,
        loading: loadingAQI
    } = useAirQuality({
        city: activeCityId,
        lat: activeLat,
        lon: activeLon
    })

    // Handle preset city selection
    const handleSelectCity = (cityId) => {
        setIsGPSActive(false)
        clearCoords()
        setCustomLocation(null)
        localStorage.removeItem("weather_custom_location")
        setSelectedCity(cityId)
        localStorage.setItem("weather_selected_city", cityId)
    }

    // Handle custom searched location selection
    const handleSelectCustomLocation = (loc) => {
        setIsGPSActive(false)
        clearCoords()
        setCustomLocation(loc)
        localStorage.setItem("weather_custom_location", JSON.stringify(loc))
    }

    // Handle GPS button click
    const handleSelectGPS = () => {
        setCustomLocation(null)
        localStorage.removeItem("weather_custom_location")
        getLocation()
    }

    // Automatically activate GPS mode once coordinates are acquired
    useEffect(() => {
        if (coords) {
            setIsGPSActive(true)
        }
    }, [coords])

    // Handle Alert Bell click: Request permission or send a test notification
    const handleAlertClick = async () => {
        if (permission === 'granted') {
            sendNotification('🔔 Weather Alerts Active', {
                body: `Notifications are active for ${current?.location || 'your selected location'}.`,
                icon: '/pwa-192x192.png',
                badge: '/favicon.svg'
            })
        } else {
            await requestPermission()
        }
    }

    // Smart automatic notification trigger when severe weather is detected
    useEffect(() => {
        if (!current || permission !== 'granted') return

        const condition = current.precipitation > 0 ? 'rain' : current.temperature >= 33 ? 'heat' : 'normal'
        const alertKey = `${current.location}_${condition}`

        // Trigger notification only once per weather state change (anti-spam)
        if (alertKey !== lastAlertKey.current) {
            lastAlertKey.current = alertKey

            if (current.precipitation > 0) {
                sendNotification(`🌧️ Rain Alert: ${current.location}`, {
                    body: `Scattered rain detected (${current.precipitation} mm). Remember your umbrella or raincoat!`,
                    icon: '/pwa-192x192.png',
                    badge: '/favicon.svg'
                })
            } else if (current.temperature >= 33) {
                sendNotification(`☀️ Heatwave Warning: ${current.location}`, {
                    body: `High outdoor temperature of ${current.temperature}°C. Stay hydrated and avoid prolonged sun exposure!`,
                    icon: '/pwa-192x192.png',
                    badge: '/favicon.svg'
                })
            }
        }
    }, [current, permission, sendNotification])

    // Smart weather alert generator for UI banner (synced with hourly rain probability)
    const getWeatherAlert = () => { 
        if (!current) return null

        const currentRainProb = hourly?.[0]?.rainProb || 0
        const isRainingOrLikely = current.precipitation > 0 || currentRainProb >= 40

        if (isRainingOrLikely) {
            return {
                type: "rain",
                bg: "bg-blue-500/20 border-blue-500/40 text-blue-400",
                icon: "🌧️", 
                title: currentRainProb >= 70 ? "High chance of rain" : "Rain is forecast",
                desc: current.precipitation > 0 
                    ? `Rain detected in the area (${current.precipitation} mm). Bring an umbrella or raincoat!`
                    : `Rain probability is high (${currentRainProb}%). It is strongly recommended to carry rain gear!`
            }
        }

        if (current.temperature >= 33) {
            return {
                type: "hot",
                bg: "bg-orange-500/20 border-orange-500/40 text-orange-400",
                icon: "☀️",
                title: "Heatwave warning",
                desc: "Outdoor temperature is quite high. Remember to apply sunscreen and stay hydrated!"
            }
        }

        return {
            type: "good",
            bg: isDark ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-emerald-500/10 border-emerald-300 text-emerald-700", 
            icon: "🌤️",
            title: "Ideal weather",
            desc: "The weather is cool and pleasant—perfect for outdoor activities!"
        }
    }

    const alert = getWeatherAlert()

    // Format daily data for 7-day charts (defensive against non-array payloads)
    const formattedDaily = Array.isArray(daily) ? daily.map(d => ({
        ...d,
        shortDate: d.date ? d.date.slice(5) : "", 
        rain: d.total_precipitation ?? 0,
        temp: d.avg_temperature ? Math.round(d.avg_temperature * 10) / 10 : 0 
    })) : []

    return (
        <div className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${
            isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
        }`}>
            <div className="max-w-3xl mx-auto p-4 md:p-8 pb-28">
                
                {/* Header Row 1: Location Badge on left, Alert Bell + Live API on right */}
                <div className="flex items-center justify-between mb-2 pt-2">
                    <span className={`inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isDark 
                            ? 'text-sky-400 bg-sky-400/10 border-sky-400/20' 
                            : 'text-sky-600 bg-sky-100 border-sky-200'
                    }`}>
                        {isGPSActive ? "📍 Your GPS Location" : `📍 ${current?.location || "Vietnam"}`}
                    </span>

                    <div className="flex items-center space-x-2">
                        {/* Theme Switcher Toggle Button */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                                isDark
                                    ? 'bg-slate-800/80 text-amber-300 border-slate-700/60 hover:bg-slate-700 shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm shadow-slate-200/50'
                            }`}
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            <span>{isDark ? "☀️" : "🌙"}</span>
                            <span className="text-[11px] font-semibold">{isDark ? "Light" : "Dark"}</span>
                        </button>

                        {/* Weather Alert Bell Button */}
                        <button
                            type="button"
                            onClick={handleAlertClick}
                            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                                permission === 'granted'
                                    ? 'bg-amber-400/15 text-amber-400 border-amber-400/40 hover:bg-amber-400/25 shadow-sm'
                                    : isDark 
                                        ? 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-700'
                                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100 shadow-sm'
                            }`}
                            title={permission === 'granted' ? 'Alerts enabled (Click to test)' : 'Enable push notifications'}
                        >
                            <span>{permission === 'granted' ? '🔔' : '🔕'}</span>
                            <span className="text-[11px]">{permission === 'granted' ? 'Alerts On' : 'Alerts'}</span>
                        </button>

                        {/* Live API Tag */}
                        <div className={`flex items-center px-2.5 py-1 rounded-full border ${
                            isDark 
                                ? 'bg-slate-900/80 border-slate-800/80 text-slate-400' 
                                : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                        }`}>
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                            <span className="text-[11px] font-medium whitespace-nowrap">Live API</span>
                        </div>
                    </div>
                </div>

                {/* Header Row 2: Full-width Title */}
                <h1 className={`text-2xl sm:text-3xl font-bold mb-4 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Current Weather
                </h1>

                {/* City Selector / GPS Navigation Bar */}
                <CitySelector 
                    selectedCity={selectedCity}
                    customLocation={customLocation}
                    onSelectCity={handleSelectCity}
                    onSelectCustomLocation={handleSelectCustomLocation}
                    isGPSActive={isGPSActive}
                    onSelectGPS={handleSelectGPS}
                    loadingGPS={loadingGPS}
                />

                {/* GPS Permission Warning (if denied) */}
                {gpsError && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 mb-6 text-amber-500 text-xs flex items-center space-x-2">
                        <span>⚠️</span>
                        <span>{gpsError} (Showing weather for the selected city instead).</span>
                    </div>
                )}

                {/* Hero Card: Current Weather */}
                {loadingCurrent ? (
                    <div className={`animate-pulse rounded-3xl h-48 border mb-6 flex items-center justify-center ${
                        isDark ? 'bg-slate-800/60 border-slate-700/50 text-slate-400' : 'bg-white/80 border-slate-200 text-slate-500'
                    }`}>
                        <p className="text-sm">Loading meteorological data...</p>
                    </div>
                ) : current ? (
                    <>
                        <div className={`relative overflow-hidden rounded-3xl p-6 mb-6 backdrop-blur-xl transition-all ${
                            isDark 
                                ? 'bg-gradient-to-br from-sky-500/20 via-slate-800/80 to-slate-900/90 border border-sky-500/30 text-white shadow-2xl' 
                                : 'bg-gradient-to-br from-sky-100/90 via-white to-sky-50/70 border border-sky-200/80 text-slate-900 shadow-lg shadow-sky-100/50'
                        }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current temperature</p>
                                    <div className="flex items-baseline space-x-2 mt-1">
                                        <span className={`text-6xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            {current.temperature}
                                        </span>
                                        <span className="text-xl font-medium text-sky-500">°C</span>
                                    </div>

                                    <p className={`font-medium mt-2 flex items-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        <span className="mr-1.5">{current.precipitation > 0 ? "🌧️ Rainy" : "🌤️ Cool, partly cloudy"}</span>
                                    </p>
                                </div>

                                <div className="text-5xl select-none">
                                    {current.precipitation > 0 ? "🌧️" : current.temperature > 30 ? "☀️" : "⛅"}
                                </div>
                            </div> 

                            <div className={`mt-4 pt-4 border-t flex justify-between text-xs ${
                                isDark ? 'border-slate-700/50 text-slate-400' : 'border-slate-200 text-slate-500'
                            }`}>
                                <span>🕒 Updated: {current.time?.replace("T", " ") || "Today"}</span>
                                <span>Station: {current.location}</span>
                            </div>
                        </div>                

                        {/* Smart Weather Alert Banner */}
                        {alert && (
                            <div className={`rounded-2xl p-4 mb-6 border ${alert.bg} flex items-start space-x-3 transition-all`}>
                                <span className="text-2xl">{alert.icon}</span>
                                <div>
                                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                                    <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{alert.desc}</p>
                                </div>
                            </div>
                        )}

                        {/* ⭐ 24-Hour Hourly Forecast Timeline (Apple Weather Style) ⭐ */}
                        <HourlyForecast data={hourly} loading={loadingHourly} />

                        {/* 4 Detail Metric Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className={`rounded-2xl p-4 backdrop-blur-md transition-all ${
                                isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/90 border border-slate-200/80 shadow-sm shadow-slate-200/40'
                            }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="p-1.5 rounded-lg bg-orange-400/10 text-orange-400 text-sm">🌡️</span>
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Temperature</span>
                                </div>
                                <p className="text-2xl font-bold text-orange-500">{current.temperature}°C</p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Feels like {Math.round(current.temperature + 1)}°C</p>
                            </div>

                            <div className={`rounded-2xl p-4 backdrop-blur-md transition-all ${
                                isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/90 border border-slate-200/80 shadow-sm shadow-slate-200/40'
                            }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="p-1.5 rounded-lg bg-blue-400/10 text-blue-400 text-sm">💧</span>
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Humidity</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-500">{current.humidity}%</p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{current.humidity > 80 ? "High humidity" : "Well-ventilated"}</p>
                            </div>

                            <div className={`rounded-2xl p-4 backdrop-blur-md transition-all ${
                                isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/90 border border-slate-200/80 shadow-sm shadow-slate-200/40'
                            }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 text-sm">💨</span>
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Wind Speed</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-500">{current.wind_speed ?? 0}
                                    <span className="text-xs font-normal ml-1">km/h</span>
                                </p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Gentle pleasant breeze</p>
                            </div>

                            <div className={`rounded-2xl p-4 backdrop-blur-md transition-all ${
                                isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white/90 border border-slate-200/80 shadow-sm shadow-slate-200/40'
                            }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="p-1.5 rounded-lg bg-sky-400/10 text-sky-400 text-sm">🌧️</span>
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rainfall</span>
                                </div>
                                <p className="text-2xl font-bold text-sky-500">{current.precipitation} 
                                    <span className="text-xs font-normal ml-1">mm</span>
                                </p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Measured over the past hour</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-red-500 text-sm">
                        ⚠️ Unable to load weather data. Please check the FastAPI connection!
                    </div>
                )}

                {/* Chart 1: 7-Day Temperature Trend */}
                <div className={`rounded-3xl p-4 mb-6 backdrop-blur-md transition-all ${
                    isDark ? 'bg-slate-800/40 border border-slate-700/50 text-white' : 'bg-white/90 border border-slate-200/80 text-slate-900 shadow-sm shadow-slate-200/40'
                }`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-sm font-semibold flex items-center ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            <span className="mr-2">📈</span>
                            7-Day Temperature Trend
                        </h2>
                        <span className="text-[11px] text-orange-500 font-medium bg-orange-400/10 px-2 py-0.5 rounded-md">
                            AVG Temp (°C)
                        </span>
                    </div>

                    {loadingDaily ? (
                        <p className="text-slate-400 text-xs py-8 text-center">Loading temperature chart...</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={170}>
                            <AreaChart data={formattedDaily}>
                                <defs>
                                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} opacity={0.6} />
                                <XAxis dataKey="shortDate" stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 10 }} />
                                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 10 }} domain={['auto', 'auto']} width={25} />
                                <Tooltip contentStyle={{ 
                                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                                    borderRadius: '12px', 
                                    fontSize: '12px',
                                    color: isDark ? '#ffffff' : '#0f172a'
                                }} />
                                <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2.5} fill="url(#tempGradient)" name="AVG Temp (°C)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Chart 2: Daily Rainfall */}
                <div className={`rounded-3xl p-4 mb-6 backdrop-blur-md transition-all ${
                    isDark ? 'bg-slate-800/40 border border-slate-700/50 text-white' : 'bg-white/90 border border-slate-200/80 text-slate-900 shadow-sm shadow-slate-200/40'
                }`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-sm font-semibold flex items-center ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            <span className="mr-2">🌧️</span>
                            Daily Rainfall (mm)
                        </h2>
                        <span className="text-[11px] text-sky-500 font-medium bg-sky-400/10 px-2 py-0.5 rounded-md">
                            Total Rain (mm)
                        </span>
                    </div>

                    {loadingDaily ? (
                        <p className="text-slate-400 text-xs py-8 text-center">Loading rainfall data...</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={formattedDaily}>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} opacity={0.6} />
                                <XAxis dataKey="shortDate" stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 10 }} />
                                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 10 }} width={25} />
                                <Tooltip contentStyle={{ 
                                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                                    borderRadius: '12px', 
                                    fontSize: '12px',
                                    color: isDark ? '#ffffff' : '#0f172a'
                                }} />
                                <Bar dataKey="rain" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Rainfall (mm)" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ⭐ Live Weather Radar Map (RainViewer) ⭐ */}
                <WeatherRadar 
                    lat={isUsingGPS ? coords.lat : current?.lat} 
                    lon={isUsingGPS ? coords.lon : current?.lon}
                    locationName={current?.location || selectedCity}
                />

                {/* ⭐ Air Quality Index Card (AQI & PM2.5) ⭐ */}
                <AirQualityCard data={aqiData} loading={loadingAQI} />

                {/* ⭐ AI Weather Assistant Chatbot (SkyBot) ⭐ */}
                <ChatAssistant 
                    current={current}
                    hourly={hourly}
                    daily={daily}
                    aqi={aqiData}
                    location={current?.location || selectedCity}
                    onSelection={handleSelectCustomLocation}
                />
            </div>
        </div>
    )
}