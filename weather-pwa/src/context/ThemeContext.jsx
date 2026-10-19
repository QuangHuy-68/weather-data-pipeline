// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { computeWeatherTheme, WEATHER_PALETTES } from '../hooks/useWeatherTheme'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    // 1. Manual Dark / Light toggle preference
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('skypulse_theme') || 'dark'
    })

    // 2. Weather data stream (populated from Home.jsx)
    const [weatherSource, setWeatherSource] = useState({ current: null, hourly: [] })

    // 3. Manual Theme Overrides (Weather Mode & Sky Atmosphere Simulator)
    const [overrideMode, setOverrideMode] = useState(null) // null = auto live weather
    const [overrideTime, setOverrideTime] = useState(null) // null = auto clock time

    // Method allowing pages to sync current weather data
    const setWeatherData = useCallback((current, hourly) => {
        setWeatherSource({ current, hourly: hourly || [] })
    }, [])

    // Compute weather-adaptive palette (respecting manual override if set)
    const weatherTheme = useMemo(() => {
        if (overrideMode && WEATHER_PALETTES[overrideMode]) {
            return { weatherMode: overrideMode, palette: WEATHER_PALETTES[overrideMode] }
        }
        if (!weatherSource.current) {
            return { weatherMode: 'clear', palette: WEATHER_PALETTES.clear }
        }
        return computeWeatherTheme(weatherSource.current, weatherSource.hourly)
    }, [weatherSource, overrideMode])

    const isDark = theme === 'dark'

    // Synchronize HTML root and body classes
    useEffect(() => {
        localStorage.setItem('skypulse_theme', theme) 
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
            document.body.className = 'bg-slate-950 text-white transition-colors duration-300'
        } else {
            document.documentElement.classList.remove('dark')
            document.body.className = 'bg-slate-50 text-slate-900 transition-colors duration-300'
        }
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    /**
     * Helper: Automatically resolves token based on current Dark or Light mode.
     */
    const p = useCallback((key) => {
        const val = weatherTheme.palette[key]
        if (val && typeof val === 'object' && ('dark' in val || 'light' in val)) {
            return isDark ? val.dark : val.light
        }
        return val
    }, [weatherTheme.palette, isDark])

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            toggleTheme, 
            isDark,
            weatherMode: weatherTheme.weatherMode,
            palette: weatherTheme.palette,
            overrideMode,
            setOverrideMode,
            overrideTime,
            setOverrideTime,
            setWeatherData,
            p
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}