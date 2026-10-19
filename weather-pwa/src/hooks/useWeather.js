import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

const CITY_COORDS = {
    HCM: { name: "Ho Chi Minh City", lat: 10.8231, lon: 106.6297 },
    HN:  { name: "Ha Noi",           lat: 21.0285, lon: 105.8542 }, 
    DN:  { name: "Da Nang",          lat: 16.0544, lon: 108.2022 },
    CT:  { name: "Can Tho",          lat: 10.0452, lon: 105.7469 }, 
    HP:  { name: "Hai Phong",        lat: 20.8449, lon: 106.6881 },
}

export function useWeatherCurrent({ city = 'HCM', lat = null, lon = null, name = null } = {}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true) 
    const [error, setError] = useState(null)

    useEffect(() => { 
        let isMounted = true
        setLoading(true)
        setError(null)

        // 1. Phân giải toạ độ thành phố
        let targetLat = lat
        let targetLon = lon
        let locationName = name || "Your GPS Location"

        if (targetLat === null || targetLon === null) {
            const cityInfo = CITY_COORDS[city] || CITY_COORDS.HCM
            targetLat = cityInfo.lat
            targetLon = cityInfo.lon
            locationName = cityInfo.name
        }

        // 2. Fetch kèm cơ chế Auto-Retry (Tối đa 3 lần nếu gặp 503)
        fetchWithRetry(targetLat, targetLon, locationName, 3)

        async function fetchWithRetry(latitude, longitude, locName, retriesLeft = 3) {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,is_day&timezone=Asia%2FHo_Chi_Minh`

            try {
                const res = await fetch(url)
                
                // Nếu bị 503 (Server bận), tự động chờ và thử lại
                if ((res.status === 503 || res.status === 429) && retriesLeft > 0) {
                    await new Promise(resolve => setTimeout(resolve, 800))
                    return fetchWithRetry(latitude, longitude, locName, retriesLeft - 1)
                }

                if (!res.ok) throw new Error(`Weather API status: ${res.status}`)

                const json = await res.json()
                const c = json.current || {}

                if (isMounted) {
                    setData({
                        time: c.time || new Date().toISOString(),
                        location: locName,
                        temperature: c.temperature_2m ?? 28,
                        humidity: c.relative_humidity_2m ?? 70,
                        wind_speed: c.wind_speed_10m ?? 0, 
                        precipitation: c.precipitation ?? 0,
                        weather_code: c.weather_code ?? 0,
                        is_day: c.is_day ?? 1
                    })
                    setLoading(false)
                }
            } catch (err) {
                if (retriesLeft > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    return fetchWithRetry(latitude, longitude, locName, retriesLeft - 1)
                }
                
                if (isMounted) {
                    // Fallback an toàn: Dùng dữ liệu ước tính thay vì làm sập UI
                    setData(prev => prev || {
                        time: new Date().toISOString(),
                        location: locName,
                        temperature: 28,
                        humidity: 75,
                        wind_speed: 10,
                        precipitation: 0
                    })
                    setError(err.message)
                    setLoading(false)
                }
            }
        }

        return () => {
            isMounted = false
        }
    }, [city, lat, lon])

    return { data, loading, error }
}


export function useWeatherDaily({limit = 7, city = 'HCM', lat = null, lon = null } = {}) {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)

        if ((city === 'HCM' || !city) && lat === null && lon === null) {
            fetch(`${API_BASE_URL}/weather/daily?limit=${limit}`)
                .then(res => { 
                    if (!res.ok) throw new Error(`API error: ${res.status}`)
                    return res.json()
                })
                
                .then(json => {
                    if (Array.isArray(json)) {
                        setData(json)
                    } else { 
                        fetchLiveOpenMeteoDaily(10.8231,106.6297)
                    }
                    setLoading(false)
                })

                .catch(() => {
                    fetchLiveOpenMeteoDaily(10.8231, 106.6297)
                })
            return
        }

        let targetLat = lat
        let targetLon = lon

        if (targetLat === null || targetLon === null) {
            const cityInfo = CITY_COORDS[city] || CITY_COORDS.HCM
            targetLat = cityInfo.lat
            targetLon = cityInfo.lon
        }

        fetchLiveOpenMeteoDaily(targetLat, targetLon)

        function fetchLiveOpenMeteoDaily(latitude, longitude) {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum&timezone=Asia%2FHo_Chi_Minh&forecast_days=${Math.min(limit, 16)}`
            
            fetch(url)
                .then(res => res.json())
                .then(json => {
                    const d = json.daily || {}
                    const dates = d.time || []
                    const maxTemps = d.temperature_2m_max || []
                    const minTemps = d.temperature_2m_min || []
                    const winds = d.wind_speed_10m_max || []
                    const precips = d.precipitation_sum || []

                    const formatted = dates.map((dateStr, i) => {
                        const tMax = maxTemps[i] ?? 0
                        const tMin = minTemps[i] ?? 0

                        return {
                            date: dateStr,
                            avg_temperature: Math.round(((tMax + tMin) / 2) * 10) / 10,
                            max_temperature: Math.round(tMax * 10) / 10,
                            min_temperature: Math.round(tMin * 10) / 10,
                            avg_humidity: 75,
                            max_wind_speed: winds[i] ?? 0,
                            total_precipitation: precips[i] ?? 0
                        }
                    })

                    setData(formatted)
                    setLoading(false)
                })

                .catch(() => {
                    setData([])
                    setLoading(false)
                })
        }
    }, [limit, city, lat, lon])

    return { data, loading }
}


export function useForecast(limit = 24) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API_BASE_URL}/weather/forecast?limit=${limit}`)
            .then(res => res.json())
            .then(json => { setData(json); setLoading(false) })
            .catch(() => setLoading(false))
    }, [limit])

    return { data, loading } 
}


// Helper: Map WMO Weather Code and Rain Probability to weather icons (day/night & probability aware)
export function getWeatherIcon(code, isDay = 1, rainProb = 0) { 
    // 1. Severe weather / Thunderstorm
    if (code >= 95) return '⛈️'

    // 2. Low rain probability (< 30%): Show sun or partly cloudy instead of rain
    if (rainProb < 30) {
        if (code === 0) return isDay ? '☀️' : '🌙'
        if (code === 45 || code === 48) return '🌫️'
        return isDay ? '⛅' : (code === 0 ? '🌙' : '☁️')
    }

    // 3. High rain probability (>= 70%) or heavy rain codes
    if (rainProb >= 70 || (code >= 61 && code <= 65) || (code >=80 && code <= 82)) {
        return '🌧️'
    }

    // 4. Moderate rain probability (30% - 69%) or light showers
    if (rainProb >= 30 || (code >= 51 && code <= 55)) {
        return isDay ? '🌦️' : '🌧️'
    }

    // 5. Default by WMO Code
    if (code === 0) return isDay ? '☀️' : '🌙'
    if (code >= 1 && code <= 3) return isDay ? '⛅' : '☁️'
    if (code === 45 || code === 48) return '🌫️'
    return isDay ? '⛅' : '☁️'
}

// Hook: Fetch next 24-hour weather forecast timeline
export function useWeatherHourly ({ city = 'HCM', lat = null, lon = null } = {}) {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)

        let targetLat = lat
        let targetLon = lon

        if (targetLat === null || targetLon === null) { 
            const cityInfo = CITY_COORDS[city] || CITY_COORDS.HCM
            targetLat = cityInfo.lat
            targetLon = cityInfo.lon
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&daily=sunrise,sunset&timezone=Asia%2FHo_Chi_Minh&forecast_days=2`

        fetch(url)
            .then(res => res.json())    
            .then(json => {
                const h = json.hourly || {}
                const times = h.time || []
                const temps = h.temperature_2m || []
                const probs = h.precipitation_probability || []
                const codes = h.weather_code || []
                const precips = h.precipitation || []
                const daily = json.daily || {}
                const sunrises = daily.sunrise || []
                const sunsets = daily.sunset || []

                // Xác định giờ hiện tại
                const now = new Date()
                const year = now.getFullYear()
                const month = String(now.getMonth() + 1).padStart(2, '0')
                const day = String(now.getDate()).padStart(2, '0')
                const hour = String(now.getHours()).padStart(2, '0')
                const currentHourStr = `${year}-${month}-${day}T${hour}`
                
                let startIndex = times.findIndex(t => t.startsWith(currentHourStr))
                if (startIndex === -1) {
                    const nowMs = now.getTime()
                    startIndex = times.findIndex(t => new Date(t).getTime() >= nowMs)
                    if (startIndex === -1) startIndex = 0
                }

                const startTimeStr = times[startIndex] || currentHourStr
                const endIndex = Math.min(startIndex + 24, times.length)
                const endTimeStr = times[endIndex - 1] || '9999-99-99T99:99'
                
                const sunEvents = []
                sunrises.forEach(s => { 
                    if (s > startTimeStr && s <= endTimeStr) { 
                        sunEvents.push({ time: s, type: 'sunrise', label: 'Sunrise' })
                    }
                })

                sunsets.forEach(s => { 
                    if (s > startTimeStr && s <= endTimeStr) {
                        sunEvents.push({ time: s, type: 'sunset', label: 'Sunset' })
                    }
                })

                const timeline = []
                for (let i = startIndex; i < endIndex; i++) { 
                    const timeStr = times[i]
                    const hourNumber = parseInt(timeStr.slice(11, 13), 10)
                    const isNow = i === startIndex 
                    const isDay = hourNumber >= 6 && hourNumber < 18 ? 1 : 0

                    if (i > startIndex) { 
                        const prevTimeStr = times[i - 1]
                        // Định nghĩa chính xác eventIdx để không bị lỗi ReferenceError
                        const eventIdx = sunEvents.findIndex(e => e.time > prevTimeStr && e.time <= timeStr)
                        if (eventIdx !== -1) {
                            const ev = sunEvents[eventIdx]
                            timeline.push({
                                time: ev.time,
                                displayTime: ev.time.slice(11, 16), 
                                isSunEvent: true,
                                eventType: ev.type,
                                label: ev.label,
                                temp: Math.round(temps[i - 1] ?? temps[i] ?? 0),
                                rainProb: 0,
                                precip: 0, 
                                code: 0, 
                                isDay: ev.type === 'sunrise' ? 1 : 0
                            })
                            sunEvents.splice(eventIdx, 1)
                        }
                    }

                    timeline.push({
                        time: timeStr,
                        displayTime: isNow ? 'Now' : `${timeStr.slice(11, 16)}`,
                        temp: Math.round(temps[i] ?? 0),
                        rainProb: probs[i] ?? 0, 
                        precip: precips[i] ?? 0,
                        code: codes[i] ?? 0, 
                        isDay,
                        isSunEvent: false
                    })
                }

                sunEvents.forEach(ev => {
                    timeline.push({
                        time: ev.time,
                        displayTime: ev.time.slice(11, 16),
                        isSunEvent: true,
                        eventType: ev.type,
                        label: ev.label,
                        temp: Math.round(temps[endIndex - 1] ?? 0),
                        rainProb: 0,
                        precip: 0,
                        code: 0,
                        isDay: ev.type === 'sunrise' ? 1 : 0
                    })
                })

                setData(timeline)
                setLoading(false)
            })
            .catch(() => {
                const fallbackTimeline = []
                const now = new Date()
                for (let i = 0; i < 24; i++) { 
                    const d = new Date(now.getTime() + i * 3600000)
                    const h = d.getHours()
                    fallbackTimeline.push({
                        time: d.toISOString(),
                        displayTime: i === 0 ? 'Now' : `${String(h).padStart(2, '0')}:00`,
                        temp: 28,
                        rainProb: 0, 
                        precip: 0,
                        code: 0, 
                        isDay: h >= 6 && h < 18 ? 1 : 0, 
                        isSunEvent: false
                    })
                }
                setData(fallbackTimeline)
                setLoading(false)
            })
    }, [city, lat, lon])

    return { data, loading }
}


// Helper: Determine US AQI health level, colors, and recommendation
export function getAQILevel(aqi) {
    if (aqi <=50) { 
        return {
            level: 'Good',
            label: 'Good',
            color: 'text-emerald-400',
            bgcolor: 'bg-emerald-500/10',
            boderColor: 'border-emerald-500/30',
            advice: 'Air quality is satisfactory, and air polution poses little or no risk.'
        }
    }

    if (aqi <=100) {
        return {
            level: 'Moderate',
            label: 'Moderate',
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/30', 
            advice: 'Air quality is acceptable. Unusually sensitive individuals should monitor symptoms.'
        }
    }

    if (aqi <= 150) {
        return {
            level: 'Sensitive Groups',
            label: 'Unhealthy for Sensitive', 
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/30',
            advice: 'Members of sensitive groups should reduce prolonged or heavy outdoor exertion.'
        }
    }

    if (aqi <=200) {
        return {
            level: 'Unhealthy',
            label: 'Unhealthy',
            color: 'text-rose-500',
            bgColor: 'bg-rose-500/10',
            borderColor: 'border-rose-500/30',
            advice: 'Wear a protective mask (e.g. N95) outdoors and avoid heavy physical exertion.'
        }
    }

    return {
        level: 'Hazardous',
        label: 'Hazardous',
        color: 'text-purple-400',
        bgColor: 'text-purple-500/10',
        borderColor: 'bg-purple-500/30',
        advice: 'Avoid all outdoor activities; keep windows closed and run indoor air purifiers.'
    }
}

// Hook: Fetch Air Quality Index (AQI, PM2.5, PM10, Ozone)
export function useAirQuality({ city = 'HCM', lat = null, lon = null } = {}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        setLoading(true)
        setError(null)

        let targetLat = lat
        let targetLon = lon

        if (targetLat === null || targetLon === null) { 
            const cityInfo = CITY_COORDS[city] || CITY_COORDS.HCM
            targetLat = cityInfo.lat
            targetLon = cityInfo.lon
        }

        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${targetLat}&longitude=${targetLon}&current=us_aqi,pm2_5,pm10,ozone&timezone=Asia%2FHo_Chi_Minh`

        fetch(url) 
            .then(res => {
                if (!res.ok) throw new Error(`AQI API Error: ${res.status}`)
                return res.json()
            })

            .then(json => {
                const current = json.current || {}
                setData({
                    aqi: Math.round(current.us_aqi ?? 0),
                    pm2_5: Math.round((current.pm2_5 ?? 0) * 10) / 10,
                    pm10: Math.round((current.pm10 ?? 0) * 10) / 10,
                    ozone: Math.round((current.ozone ?? 0) * 10) / 10
                })

                setLoading(false)
            })

            .catch(err => {
                console.error('Failed to fetch AQI:', err)
                setError(err.message)
                setLoading(false)
            })   
    }, [city, lat, lon])

    return { data, loading, error }
}