import { useState } from 'react'

export function useGeolocation() {
    const [coords, setCoords] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("Your browser does not support GPS positioning.")
            return
        }

        setLoading(true)
        setError(null)

        navigator.geolocation.getCurrentPosition(
            (position) => { 
                setCoords({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                })
                setLoading(false)
            },
            (err) => { 
                let msg = "Unable to secure the position."
                if (err.code === 1) msg = "You have denied access to your location."
                else if (err.code === 2) msg = "Device location could not be determined."
                else if (err.code === 3) msg = "Location retrieval request timed out."

                setError(msg)
                setLoading(false)
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        )
    }

    const clearCoords = () => { 
        setCoords(null)
    }

    return { coords, loading, error, getLocation, clearCoords }
}