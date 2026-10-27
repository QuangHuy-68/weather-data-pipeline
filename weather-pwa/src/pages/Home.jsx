import { useState, useEffect, useRef } from "react"
import { useWeatherCurrent, useWeatherDaily, useWeatherHourly, useAirQuality } from "../hooks/useWeather"
import { useTheme } from "../context/ThemeContext"
import { useGeolocation } from "../hooks/useGeolocation"
import { useNotification } from "../hooks/useNotification"
import { useInstallPrompt } from "../hooks/useInstallPrompt"
import CitySelector from "../components/CitySelector"
import HourlyForecast from "../components/HourlyForecast"
import AirQualityCard from "../components/AirQualityCard"
import ChatAssistant from "../components/ChatAssistant"
import WeatherRadar from "../components/WeatherRadar"
import WeatherBackground from "../components/WeatherBackground"
import { HeroWeatherIcon } from "../components/WeatherIcons"
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
    const { theme, toggleTheme, setWeatherData, p, weatherMode, overrideMode, setOverrideMode, overrideTime, setOverrideTime } = useTheme()
    const [showThemeModal, setShowThemeModal] = useState(false)
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
    const { isInstallable, promptInstall } = useInstallPrompt()
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

                const condition = current.precipitation > 0 ? 'rain' : current.temperature >= 33 ? 'heat' : current.temperature <= 5 ? 'cold' : 'normal'
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
                sendNotification(`Heatwave Warning: ${current.location}`, {
                    body: `High outdoor temperature of ${current.temperature}°C. Stay hydrated and avoid prolonged sun exposure!`,
                    icon: '/pwa-192x192.png',
                    badge: '/favicon.svg'
                })
            } else if (current.temperature <= 5) {
                sendNotification(`🥶 Freezing Alert: ${current.location}`, {
                    body: `Freezing outdoor temperature (${current.temperature}°C). Keep warm and wear thermal layers!`,
                    icon: '/pwa-192x192.png',
                    badge: '/favicon.svg'
                })
            }
        }
    }, [current, permission, sendNotification])

    
    useEffect(() => {
        if (current) {
            setWeatherData(current, hourly)
        }
    }, [current, hourly, setWeatherData])

    // Smart weather alert generator for UI banner (Hierarchical Multi-Weather Advisory)
    const getWeatherAlert = () => { 
        if (!current) return null

        // Khai báo lại các biến chỉ số thời tiết
        const currentRainProb = hourly?.[0]?.rainProb || 0
        const weatherCode = hourly?.[0]?.code ?? 0
        const wind = current.wind_speed ?? 0

        // 0. Khi trời quang (Clear): Banner đồng bộ với trạng thái quang đãng
        if (weatherMode === 'clear' || overrideMode === 'clear') {
            return {
                type: "clear",
                level: "CLEAR SKY",
                levelBg: "bg-[#2f9bff] text-white font-medium",
                icon: "☀️",
                bg: "bg-white/85 border-white text-[#0a2850] shadow-md shadow-[#0a2850]/5",
                title: "Trời quang nắng nhẹ",
                desc: "Không khí trong lành, thoáng đãng và sạch sẽ. Điều kiện lý tưởng cho các hoạt động ngoài trời."
            }
        }

        // 1. Cực kỳ nguy hiểm: Giông bão sấm sét (WMO >= 95)
        if (weatherCode >= 95) {
            return {
                type: "storm",
                level: "SEVERE WARNING",
                levelBg: "bg-purple-500 text-white",
                icon: "⛈️",
                bg: isDark ? "bg-purple-950/40 border-purple-500/40 text-purple-200" : "bg-purple-50 border-purple-300 text-purple-900",
                title: "Severe Thunderstorm Warning",
                desc: "Lightning strikes and violent squalls detected. Seek immediate indoor shelter and avoid open terrain!"
            }
        }

        // 2. Mưa thực tế hoặc xác suất mưa cao
        if (current.precipitation > 0 || currentRainProb >= 50) {
            return {
                type: "rain",
                level: current.precipitation > 2 || currentRainProb >= 80 ? "HEAVY RAIN" : "ADVISORY",
                levelBg: "bg-blue-500 text-white",
                icon: "🌧️",
                bg: isDark ? "bg-blue-950/40 border-blue-500/40 text-blue-200" : "bg-blue-50 border-blue-300 text-blue-900",
                title: current.precipitation > 0 ? "Active Precipitation Detected" : "High Rain Probability",
                desc: current.precipitation > 0 
                    ? `Precipitation recorded (${current.precipitation} mm). Roads may be slick—carry umbrella or waterproof gear.`
                    : `Precipitation probability is elevated (${currentRainProb}%). Carrying portable rain gear is strongly advised.`
            }
        }
    

        // 3. Tuyết rơi (WMO 71-77)
        if (weatherCode >= 71 && weatherCode <= 77) {
            return {
                type: "snow",
                level: "WINTER ALERT",
                levelBg: "bg-sky-400 text-slate-900 font-bold",
                icon: "❄️",
                bg: isDark ? "bg-sky-950/40 border-sky-400/40 text-sky-200" : "bg-sky-50 border-sky-300 text-sky-900",
                title: "Snow Flurries Advisory",
                desc: "Active snowfall and frost accumulation. Watch out for icy roadways and reduced surface grip!"
            }
        }

        // 4. Gió giật mạnh (Wind >= 35 km/h)
        if (wind >= 35) {
            return {
                type: "wind",
                level: "WIND ADVISORY",
                levelBg: "bg-amber-500 text-white",
                icon: "💨",
                bg: isDark ? "bg-amber-950/40 border-amber-500/40 text-amber-200" : "bg-amber-50 border-amber-300 text-amber-900",
                title: "High Wind Advisory",
                desc: `Sustained winds of ${wind} km/h recorded. Secure loose rooftop objects and exercise caution while driving.`
            }
        }

        // 5. Nắng nóng gay gắt / Sốc nhiệt (>= 33°C)
        if (current.temperature >= 33) {
            return {
                type: "hot",
                level: "HEAT WARNING",
                levelBg: "bg-orange-500 text-white",
                icon: "🔥",
                bg: isDark ? "bg-orange-950/40 border-orange-500/40 text-orange-200" : "bg-orange-50 border-orange-300 text-orange-900",
                title: "Extreme Heatwave Warning",
                desc: "Elevated outdoor heat and solar intensity. Stay in shaded spaces, hydrate frequently, and use UV protection."
            }
        }

        // 6. Sương mù dày đặc (WMO 45, 48)
        if (weatherCode === 45 || weatherCode === 48) {
            return {
                type: "fog",
                level: "VISIBILITY ALERT",
                levelBg: "bg-slate-500 text-white",
                icon: "🌫️",
                bg: isDark ? "bg-slate-900/50 border-slate-500/40 text-slate-200" : "bg-slate-100 border-slate-300 text-slate-800",
                title: "Dense Fog & Mist Advisory",
                desc: "Hazardous road visibility due to heavy atmospheric moisture. Use low-beam fog lights and maintain stopping distance."
            }
        }

        // 7. Giá rét / Nhiệt độ âm (<= 5°C)
        if (current.temperature <= 5) {
            return {
                type: "freezing",
                level: current.temperature <= 0 ? "FREEZE WARNING" : "COLD ADVISORY",
                levelBg: "bg-cyan-500 text-slate-950 font-bold",
                icon: current.temperature <= 0 ? "🥶" : "❄️",
                bg: isDark ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-200" : "bg-cyan-50 border-cyan-300 text-cyan-900",
                title: current.temperature <= 0 ? "Sub-Zero Freezing Warning" : "Cold Weather Advisory",
                desc: current.temperature <= 0
                    ? `Severe freezing temperature (${current.temperature}°C). Wear multi-layered thermal apparel to protect against frostbite.`
                    : `Crisp low temperature (${current.temperature}°C). Don a warm jacket and scarf before stepping outside.`
            }
        }

        // 8. Trạng thái lý tưởng mặc định
        return {
            type: "good",
            level: "OPTIMAL",
            levelBg: "bg-emerald-500 text-white",
            icon: "✨",
            bg: isDark ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200" : "bg-emerald-50/70 border-emerald-200 text-emerald-800", 
            title: "Ideal Weather Conditions",
            desc: "Atmospheric conditions are mild, clean, and highly favorable for outdoor activities and travel."
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

    // ── Helper: Tính nhiệt độ cảm nhận (Feels Like) chuẩn xác dựa vào nhiệt độ, độ ẩm và gió
    const computeFeelsLike = (temp, humidity, wind) => {
        if (temp == null) return 0
        
        const e = (humidity / 100) * 6.105 * Math.exp((17.27 * temp) / (237.7 + temp))
        const feels = temp + 0.33 * e -0.7 * (wind / 3.6) - 4.0
        return Math.round(feels * 10) / 10
    }

    const feelsLikeTemp = current ? computeFeelsLike(current.temperature, current.humidity, current.wind_speed ?? 0) : null
    const feelsLikeDiff = feelsLikeTemp != null && current ? Math.round((feelsLikeTemp - current.temperature) * 10) / 10 : 0
    const feelsLikeDesc = feelsLikeDiff > 1.5 
        ? "Humidity makes it feel warmer"
        : feelsLikeDiff < -1.5
            ? "Wind makes it feel cooler"
            : "Similar to actual temp"

    // ── Helper: Mô tả sức gió theo chuẩn thang đo Beaufort
    const getWindDescription = (speedKmh) => {
        if (speedKmh < 5) return "Calm air"
        if (speedKmh < 20) return "Gentle breeze"
        if (speedKmh < 39) return "Moderate breeze"
        if (speedKmh < 62) return "Strong breeze"
        return "Gale warning!"
    }

    // ── Nhiệt độ Cao / Thấp trong ngày từ dữ liệu daily
    const todayMax = daily?.[0]?.max_temperature ?? (current ? Math.round(current.temperature + 2) : 32)
    const todayMin = daily?.[0]?.min_temperature ?? (current ? Math.round(current.temperature - 3) : 24)

    return (
        <div className={`min-h-screen w-full overflow-x-hidden transition-colors duration-300 ${
            isDark ? 'bg-transparent text-white' : 'bg-transparent text-slate-900'
        }`}>
            <WeatherBackground current={current} hourly={hourly} />
            <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8 pb-28">
                
                {/* Header Row 1: Location Badge on left, Alert Bell + Live API on right */}
                <div className="flex items-center justify-between mb-2 pt-2">
                    <span className={`inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isDark 
                            ? 'text-sky-400 bg-sky-400/10 border-sky-400/20' 
                            : 'text-sky-600 bg-sky-100 border-sky-200'
                    }`}>
                        {isGPSActive ? "Your GPS Location" : `${current?.location || "Vietnam"}`}
                    </span>

                    <div className="flex items-center space-x-2">
                        {/* PWA 1-Click Install Button (Auto-hidden if already installed) */}
                        {isInstallable && (
                            <button 
                                type="button"
                                onClick={promptInstall}
                                className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 border animate-pulse ${
                                    isDark
                                        ? 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-400/40 hover:bg-sky-500/30'
                                        : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-transparent hover:opacity-90 shadow-sm shadow-sky-500/30'
                                }`}
                                title="Install SkyPulse on your device"
                            >
                                <span className="text-[11px]">Install</span>
                            </button>
                        )}

                                                {/* 1. Theme Controller Button (Pure Minimalist Pill) */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowThemeModal(!showThemeModal)}
                                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border ${
                                    overrideMode || overrideTime
                                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                                        : isDark
                                            ? 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:text-white hover:bg-slate-700'
                                            : 'bg-white text-slate-700 border-slate-200 hover:text-slate-900 shadow-sm'
                                }`}
                                title="Custom Weather & Sky Controller"
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p('accent') }} />
                                <span className="text-[11px] font-bold tracking-wide">
                                    {overrideMode ? overrideMode.toUpperCase() : 'Theme'}
                                </span>
                            </button>

                            {/* Dropdown Menu Minimalist (Thuần chữ tinh tế, không emoji) */}
                            {showThemeModal && (
                                <div className={`absolute right-0 top-full mt-2 z-50 w-72 rounded-3xl p-4 backdrop-blur-2xl border shadow-2xl animate-in fade-in slide-in-from-top-2 ${
                                    isDark ? 'bg-slate-900/95 border-white/10 text-white shadow-black/80' : 'bg-white/95 border-white/80 text-slate-900 shadow-slate-300/80'
                                }`}>
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p('accent') }} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Atmosphere & Weather</span>
                                        </div>
                                        <button 
                                            onClick={() => setShowThemeModal(false)}
                                            className="text-xs text-slate-400 hover:text-white px-1"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* 1. Bầu trời */}
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Sky Atmosphere</p>
                                    <div className="grid grid-cols-2 gap-1.5 mb-3.5">
                                        {[
                                            { id: null, label: 'Auto Clock' },
                                            { id: 'sunrise', label: 'Sunrise' },
                                            { id: 'noon', label: 'Daylight' },
                                            { id: 'sunset', label: 'Sunset' },
                                            { id: 'midnight', label: 'Midnight' },
                                        ].map(item => (
                                            <button
                                                key={String(item.id)}
                                                onClick={() => setOverrideTime(item.id)}
                                                className={`text-[11px] font-semibold py-1.5 px-2.5 rounded-xl border transition-all text-left truncate ${
                                                    overrideTime === item.id
                                                        ? 'bg-amber-500 text-white border-amber-400 shadow-sm'
                                                        : isDark 
                                                            ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' 
                                                            : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* 2. Hiệu ứng thời tiết */}
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Weather Layer</p>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[
                                            { id: null, label: 'Live' },
                                            { id: 'rainy', label: 'Rain' },
                                            { id: 'stormy', label: 'Storm' },
                                            { id: 'snowy', label: 'Snow' },
                                            { id: 'foggy', label: 'Fog' },
                                            { id: 'clear', label: 'Clear' },
                                        ].map(item => (
                                            <button
                                                key={String(item.id)}
                                                onClick={() => setOverrideMode(item.id)}
                                                className={`text-[11px] font-bold py-1.5 px-2 rounded-xl border transition-all text-center ${
                                                    overrideMode === item.id
                                                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                                                        : isDark 
                                                            ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' 
                                                            : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Nút Reset */}
                                    {(overrideMode || overrideTime) && (
                                        <button
                                            onClick={() => {
                                                setOverrideMode(null)
                                                setOverrideTime(null)
                                            }}
                                            className="w-full mt-3 py-1.5 text-center text-xs font-bold rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                                        >
                                            Reset to Live Weather
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

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
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight text-white drop-shadow-sm">
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

                {/* Hero & Metric Cards Skeleton Loading (Apple Shimmer Wave) */}
                {loadingCurrent ? (
                    <div className="space-y-6 mb-6">
                        {/* 1. Hero Card Skeleton */}
                        <div className={`relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl border animate-shimmer shadow-xl ${
                            isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white/60 border-white/80 shadow-slate-200/50'
                        }`}>
                            <div className="flex justify-between items-center">
                                <div className="space-y-3">
                                    <div className={`h-3 w-28 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                    <div className={`h-14 w-36 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                    <div className={`h-4 w-44 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                    <div className="flex space-x-2 pt-1">
                                        <div className={`h-5 w-14 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                        <div className={`h-5 w-14 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                    </div>
                                </div>
                                <div className={`w-20 h-20 rounded-full mr-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                            </div>
                            <div className={`mt-5 pt-3.5 border-t flex justify-between ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                <div className={`h-3 w-32 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                <div className={`h-3 w-28 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                            </div>
                        </div>

                        {/* 2. 4 Metric Cards Skeleton */}
                        <div className="grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div 
                                    key={i} 
                                    className={`rounded-2xl p-4 backdrop-blur-xl border animate-shimmer space-y-2.5 ${
                                        isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white/60 border-white/80'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className={`h-4 w-10 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                        <div className={`h-3 w-16 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                    </div>
                                    <div className={`h-7 w-20 rounded-xl ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                    <div className={`h-2.5 w-28 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : current ? (
                    <>
                                                {/* Main Weather Card (Sáng nhẹ, thoáng sạch, tâm điểm là con số nhiệt độ) */}
                        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 mb-6 transition-all bg-gradient-to-br ${p('gradient')} border ${p('border')} ${p('glow')}`}>
                            
                            {/* Vầng sáng mặt trời dịu dàng ở góc card (#ffd966) */}
                            {(weatherMode === 'clear' || overrideMode === 'clear') && (
                                <div 
                                    className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
                                    style={{
                                        background: 'radial-gradient(circle, rgba(255, 217, 102, 0.45) 0%, rgba(191, 230, 255, 0.2) 45%, transparent 70%)',
                                        filter: 'blur(16px)',
                                    }}
                                />
                            )}

                            <div className="flex justify-between items-center relative z-10">
                                {/* Bên trái: Nhãn thường, Con số nhiệt độ khổng lồ, Trạng thái & Min/Max */}
                                <div>
                                    <p className="text-xs font-medium text-[#0a2850]/75">
                                        Current temperature
                                    </p>
                                    
                                    {/* Điểm nhấn duy nhất: con số nhiệt độ thật lớn */}
                                    <div className="flex items-baseline space-x-1.5 mt-1">
                                        <span className="text-7xl sm:text-8xl font-black tracking-tight text-[#0a2850]">
                                            {current.temperature}
                                        </span>
                                        <span className="text-2xl sm:text-3xl font-bold text-[#2f9bff]">°C</span>
                                    </div>

                                    {/* Trạng thái thời tiết */}
                                    <p className="font-semibold text-base mt-2 flex items-center text-[#0a2850]">
                                        <span>{p('name')}</span>
                                    </p>

                                    {/* Chỉ số High / Low tương phản rõ nét với text-[#0a2850] */}
                                    <div className="flex items-center space-x-2.5 mt-2.5 text-xs font-medium">
                                        <span className="px-2.5 py-0.5 rounded-full bg-[#bfe6ff]/70 text-[#0a2850] font-semibold border border-white/80">
                                            H: {todayMax}°
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full bg-[#bfe6ff]/70 text-[#0a2850] font-semibold border border-white/80">
                                            L: {todayMin}°
                                        </span>
                                        <span className="text-[11px] text-[#0a2850]/75 font-medium">
                                            Feels like {feelsLikeTemp ?? current.temperature}°
                                        </span>
                                    </div>
                                </div>

                                {/* Bên phải: Icon mặt trời nắng dịu tĩnh lặng */}
                                <div className="mr-2 flex flex-col items-center">
                                    <HeroWeatherIcon 
                                        code={hourly?.[0]?.code ?? current?.weather_code ?? 0}
                                        isDay={current?.is_day ?? hourly?.[0]?.isDay ?? 1}
                                        rainProb={current?.precipitation > 0 ? 80 : (hourly?.[0]?.rainProb ?? 0)}
                                        weatherMode={weatherMode}
                                    />
                                </div>
                            </div> 

                            {/* Dòng chân Card */}
                            <div className="mt-5 pt-3.5 border-t border-[#0a2850]/10 flex justify-between text-[11px] text-[#0a2850]/70 font-medium relative z-10">
                                <span>Updated: {current.time?.replace("T", " ") || "Today"}</span>
                                <span>Station: {current.location}</span>
                            </div>
                        </div>        

                        {/* Smart Weather Alert Banner (Clean Typography & Status Dot) */}
                        {alert && (
                            <div className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 mb-6 border backdrop-blur-xl transition-all duration-300 shadow-xl ${alert.bg}`}>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 animate-pulse" style={{ backgroundColor: p('accent') }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${alert.levelBg}`}>
                                                {alert.level}
                                            </span>
                                            <h4 className="font-bold text-sm tracking-tight truncate">
                                                {alert.title}
                                            </h4>
                                        </div>
                                        <p className="text-xs opacity-90 leading-relaxed font-medium">
                                            {alert.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ⭐ 24-Hour Hourly Forecast Timeline (Apple Weather Style) ⭐ */}
                        <HourlyForecast data={hourly} loading={loadingHourly} />

                                                {/* 4 Detail Metric Cards (Apple Weather Glassmorphism & Smart Descriptions) */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {/* Card 1: FEELS LIKE */}
                            <div className={`rounded-2xl p-4 backdrop-blur-md transition-all duration-300 border ${
                                isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200/90 shadow-sm'
                            }`} style={{ borderColor: isDark ? `${p('accent')}33` : undefined }}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="p-1 rounded-md text-[10px] font-bold" style={{ backgroundColor: `${p('accent')}20`, color: p('accent') }}>
                                        FEEL
                                    </span>
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Feels Like</span>
                                </div>
                                <p className="text-2xl font-bold" style={{ color: p('accent') }}>{feelsLikeTemp ?? current.temperature}°C</p>
                                <p className={`text-[10px] mt-1 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {feelsLikeDesc}
                                </p>
                            </div>

                            {/* Card 2: HUMIDITY */}
                            <div className={`rounded-2xl p-4 backdrop-blur-md transition-all duration-300 border ${
                                isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200/90 shadow-sm'
                            }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="p-1 rounded-md bg-sky-400/10 text-sky-400 text-[10px] font-bold">
                                        HUMID
                                    </span>
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Humidity</span>
                                </div>
                                <p className="text-2xl font-bold text-sky-400">{current.humidity}%</p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {current.humidity > 80 ? "Saturated humidity" : current.humidity > 60 ? "Comfortable level" : "Dry air conditions"}
                                </p>
                            </div>

                            {/* Card 3: WIND SPEED */}
                            <div className={`rounded-2xl p-4 backdrop-blur-md transition-all duration-300 border ${
                                isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200/90 shadow-sm'
                            }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="p-1 rounded-md bg-emerald-400/10 text-emerald-400 text-[10px] font-bold">
                                        WIND
                                    </span>
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Wind Speed</span>
                                </div>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {current.wind_speed ?? 0}
                                    <span className="text-xs font-normal ml-1">km/h</span>
                                </p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {getWindDescription(current.wind_speed ?? 0)}
                                </p>
                            </div>

                            {/* Card 4: RAINFALL / PRECIPITATION */}
                            <div className={`rounded-2xl p-4 backdrop-blur-md transition-all duration-300 border ${
                                isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white/80 border-slate-200/90 shadow-sm'
                            }`}>
                                <div className="flex items-center space-x-2 mb-2">
                                    <span className="p-1 rounded-md bg-blue-400/10 text-blue-400 text-[10px] font-bold">
                                        RAIN
                                    </span>
                                    <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Precipitation</span>
                                </div>
                                <p className="text-2xl font-bold text-blue-400">
                                    {current.precipitation} 
                                    <span className="text-xs font-normal ml-1">mm</span>
                                </p>
                                <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {current.precipitation > 0 
                                        ? "Rain active in past hour" 
                                        : hourly?.[0]?.rainProb > 0 
                                            ? `Rain chance: ${hourly[0].rainProb}%` 
                                            : "No rain in past hour"}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-red-500 text-sm">
                        ⚠️ Unable to load weather data. Please check the FastAPI connection!
                    </div>
                )}

                {/* Chart 1: 7-Day Temperature Trend (Ultra-Glassmorphism) */}
                <div className={`rounded-3xl p-4 mb-6 backdrop-blur-md transition-all duration-300 border shadow-xl ${
                    isDark ? 'bg-slate-900/45 border-white/10 text-white shadow-black/40' : 'bg-white/70 border-white/80 text-slate-900 shadow-slate-200/60' 
                }`}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p('accent') }} />
                            <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                7-Day Temperature Trend
                            </h2>
                        </div>
                    
                        <span 
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                            style={{ 
                                backgroundColor: `${p('accent')}15`, 
                                color: p('accent'),
                                borderColor: `${p('accent')}30`
                            }}
                        >
                            AVG Temp (°C)
                        </span>
                    </div>

                    {loadingDaily ? (
                        <p className="text-slate-400 text-xs py-8 text-center">Loading temperature chart...</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={170}>
                            <AreaChart data={formattedDaily}>
                                <defs>
                                    <linearGradient id="weatherTempGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={p('accent')} stopOpacity={0.45}/>
                                        <stop offset="95%" stopColor={p('accent')} stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} opacity={0.4} />
                                <XAxis dataKey="shortDate" stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 10 }} />
                                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 10 }} domain={['auto', 'auto']} width={25} />
                                <Tooltip contentStyle={{ 
                                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)', 
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, 
                                    borderRadius: '16px', 
                                    backdropFilter: 'blur(12px)',
                                    fontSize: '12px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                    color: isDark ? '#ffffff' : '#0f172a'
                                }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="temp" 
                                    stroke={p('accent')} 
                                    strokeWidth={3} 
                                    fill="url(#weatherTempGradient)" 
                                    name="AVG Temp (°C)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Chart 2: Daily Rainfall (Adaptive Color Accent) */}
                <div className={`rounded-3xl p-4 mb-6 backdrop-blur-xl transition-all duration-300 border shadow-xl ${
                    isDark ? 'bg-slate-900/45 border-white/10 text-white shadow-black/40' : 'bg-white/70 border-white/80 text-slate-900 shadow-slate-200/60'
                }`}>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: p('accent') }}/>
                            <h2 className={`text-xs font-bold uppercase tracking-wider flex ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                Daily Rainfall (mm)
                            </h2>
                        </div>
                        <span 
                            className="text-[11px] font-msemibold px-2.5 py-0.5 rounded-full border"
                            style={{ 
                                backgroundColor: `${p('accent')}15`, 
                                color: p('accent'),
                                borderColor: `${p('accent')}30` 
                            }}
                        >
                            Total Rain (mm)
                        </span>
                    </div>

                    {loadingDaily ? (
                        <p className="text-slate-400 text-xs py-8 text-center">Loading rainfall data...</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={formattedDaily}>
                                <defs>
                                    <linearGradient id="weatherRainGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={p('accent')} stopOpacity={0.9}/>
                                        <stop offset="100%" stopColor={p('accent')} stopOpacity={0.35}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} opacity={0.4} />
                                <XAxis dataKey="shortDate" stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 10 }} />
                                <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fontSize: 10 }} width={25} />
                                <Tooltip contentStyle={{ 
                                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)', 
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, 
                                    borderRadius: '16px', 
                                    backdropFilter: 'blur(12px)',
                                    fontSize: '12px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                    color: isDark ? '#ffffff' : '#0f172a'
                                }} />
                                <Bar dataKey="rain" fill="url(#weatherRainGradient)" radius={[8, 8, 2, 2]} name="Rainfall (mm)" />
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