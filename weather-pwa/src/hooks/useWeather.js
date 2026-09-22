import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

const CITY_COORDS = {
    HCM: { name: "Ho Chi Minh City", lat: 10.8231, lon: 106.6297 },
    HN:  { name: "Ha Noi",           lat: 21.0285, lon: 105.8542 }, 
    DN:  { name: "Da Nang",          lat: 16.0544, lon: 108.2022 },
    CT:  { name: "Can Tho",          lat: 10.0452, lon: 105.7469 }, 
    HP:  { name: "Hai Phong",        lat: 20.8449, lon: 106.6881 },
}

export function useWeatherCurrent({ city = 'HCM', lat = null, lon = null } = {}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true) 
    const [error, setError] = useState(null)

    useEffect(() => { 
        setLoading(true)
        setError(null)

        if ((city === 'HCM' || !city) && lat === null && lon === null) { 
            fetch(`${API_BASE_URL}/weather/current`)
                .then(res => {
                    if (!res.ok) throw new Error(`API error: ${res.status}`)
                    return res.json()
                })

                .then(json => { 
                    setData(json)
                    setLoading(false)
                })
                .catch(() => {
                    fetchLiveOpenMeteoCurrent(10.8231, 106.6297, "Ho Chi Minh City")
                })

            return
        }

        let targetLat = lat
        let targetLon = lon
        let locationName = "Your GPS Location"

        if (targetLat === null || targetLon === null) {
            const cityInfo = CITY_COORDS[city] || CITY_COORDS.HCM
            targetLat = cityInfo.lat
            targetLon = cityInfo.lon
            locationName = cityInfo.name
        }

        fetchLiveOpenMeteoCurrent(targetLat, targetLon, locationName)

        function fetchLiveOpenMeteoCurrent(latitude, longitude, name) {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=Asia%2FHo_Chi_Minh`

            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
                    return res.json()
                })

                .then(json => {
                    const c = json.current || {}
                    setData({
                        time: c.time || new Date().toISOString(),
                        location: name,
                        temperature: c.temperature_2m ?? 0,
                        humidity: c.relative_humidity_2m ?? 0,
                        wind_speed: c.wind_speed_10m ?? 0, 
                        precipitation: c.precipitation ?? 0
                    })
                    setLoading(false)
                })
                .catch(err => { 
                    setError(err.message)
                    setLoading(false)
                })
        }
    }, [city, lat, lon])

    return { data, loading }
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


// Helper: Map WMO Weather Code to weather icons (day/night aware)
export function getWeatherIcon(code, isDay = 1) {
    if (code === 0) return isDay ? '☀️' : '🌙'
    if (code >= 1 && code <= 3) return isDay ? '⛅' : '☁️'
    if (code === 45 || code === 48) return '🌫️'
    if (code >= 51 && code <= 55) return '🌦️'
    if (code >= 61 && code <= 65) return '🌧️'
    if (code >= 80 && code <= 82) return '🌧️'
    if (code >= 95) return '⛈️'
    return isDay ? '⛅' : '☁️'
}

// Hook: Fetch next 24-hour weather forecast timeline
export function useWeatherHourly ({ city = 'HCM', lat = null, lon = null } = {}) {
    const [data, setData] = useState([])
    const[loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)

        let targetLat = lat
        let targetLon = lon

        if (targetLat === null || targetLon === null) { 
            const cityInfo = CITY_COORDS[city] || CITY_COORDS.HCM
            targetLat = cityInfo.lat
            targetLon = cityInfo.lon
        }

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&hourly=temperature_2m,precipitation_probability,precipitation,weather_code&timezone=Asia%2FHo_Chi_Minh&forecast_days=2`

        fetch(url)
            .then(res => res.json())    
            .then(json => {
                const h = json.hourly || {}
                const times = h.time || []
                const temps = h.temperature_2m || []
                const probs = h.precipitation_probability || []
                const codes = h.weather_code || []

                // Match current hour in local time
                const now = new Date()
                const currentHourStr = now.toISOString().slice(0, 13)
                
                let startIndex = times.findIndex(t => t.startsWith(currentHourStr))
                if (startIndex === -1) startIndex = 0 

                // Slice next 24 hours starting from current hour\
                const next24Hours = []
                for (let i = startIndex; i < Math.min(startIndex + 24, times.length); i++) {
                    const timeStr = times[i]
                    const hourNumber = parseInt(timeStr.slice(11, 13), 10)
                    const isNow = i === startIndex
                    const isDay = hourNumber >= 6 && hourNumber < 18 ? 1 : 0

                    next24Hours.push({
                        time: timeStr,
                        displayTime: isNow ? 'Now' : `${timeStr.slice(11, 16)}`,
                        temp: Math.round(temps[i] ?? 0),
                        rainProb: probs[i] ?? 0,
                        code: codes[i] ?? 0,
                        isDay
                    })
                }

                setData(next24Hours)
                setLoading(false)
            })
            .catch(() => {
                setData([])
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