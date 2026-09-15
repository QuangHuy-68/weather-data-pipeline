import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

export function useWeatherCurrent({ city = 'HCM', lat = null, lon = null } = {}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true) 
    const [error, setError] = useState(null)

    useEffect(() => { 
        setLoading(true)
        setError(null)
        let url = `${API_BASE_URL}/weather/current`
        if (lat !== null && lon !== null) { 
            url += `?lat=${lat}&lon=${lon}`
        } else { 
            url += `?city=${city}`
        }

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`API connection error: ${res.status}`)
                return res.json()
            })
            .then(json => { setData(json); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [city, lat, lon])

    return { data, loading, error } 
}


export function useWeatherDaily({limit = 7, city = 'HCM', lat = null, lon = null } = {}) {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)

        let url = `${API_BASE_URL}/weather/daily?limit=${limit}`
        if (lat !== null && lon !== null) {
            url += `&lat=${lat}&lon=${lon}`
        } else {
            url += `&city=${city}`
        }

        fetch(url)
            .then(res => res.json())
            .then(json => { setData(json); setLoading(false) })
            .catch(() => setLoading(false))
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