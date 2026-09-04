import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

export function useWeatherCurrent() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true) 
    const [error, setError] = useState(null)

    useEffect(() => { 
        fetch(`${API_BASE_URL}/weather/current`)
            .then(res => res.json())
            .then(json => { setData(json); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [])

    return { data, loading, error } 
}


export function useWeatherDaily(limit = 7) {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API_BASE_URL}/weather/daily?limit=${limit}`)
            .then(res => res.json())
            .then(json => { setData(json); setLoading(false) })
            .catch(() => setLoading(false))
    }, [limit])

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