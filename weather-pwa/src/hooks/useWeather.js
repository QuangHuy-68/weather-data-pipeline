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