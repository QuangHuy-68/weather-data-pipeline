/**
 * ═══════════════════════════════════════════════════════════
 *  Animated Weather Icons & Micro-interactions
 *  Component wrapper for emoji icons with CSS animation
 *  matching weather type (sun=glow, rain=drip, storm=shake, fog=fade, snow=drift...)
 * ═══════════════════════════════════════════════════════════
 */

import { getWeatherIcon } from '../hooks/useWeather'

/**
 * Get CSS animation class based on weather code and rain probability
 */
function getAnimationClass(code, rainProb, isDay) {
    // Thunderstorm — flash + shake
    if (code >= 95) return 'animate-weather-storm'

    // Snowfall — gentle cloud breathing (reuse cloud float for snow)
    if (code >= 71 && code <= 77) return 'animate-weather-fog'

    // Heavy rain or high probability — drip animation
    if ((code >= 61 && code <= 82) || rainProb >= 70) return 'animate-weather-rain-heavy'

    // Light rain / drizzle — gentle bob
    if ((code >= 51 && code <= 55) || rainProb >= 40) return 'animate-weather-rain'

    // Fog / mist
    if (code === 45 || code === 48) return 'animate-weather-fog'

    // Partly cloudy — gentle float
    if (code >= 1 && code <= 3) return isDay ? 'animate-weather-cloud' : 'animate-weather-moon'

    // Clear sky — sun glow or moon twinkle
    if (code === 0) return isDay ? 'animate-weather-sun' : 'animate-weather-moon'

    return 'animate-weather-cloud'
}

/**
 * Animated Weather Icon component
 * Wraps emoji icons with weather-appropriate CSS animations
 *
 * @param {number} code - WMO weather code
 * @param {number} isDay - 1 for day, 0 for night
 * @param {number} rainProb - Rain probability percentage
 * @param {string} size - 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
export default function WeatherIcon({ code = 0, isDay = 1, rainProb = 0, size = 'md' }) {
    const icon = getWeatherIcon(code, isDay, rainProb)
    const animClass = getAnimationClass(code, rainProb, isDay)

    const sizeMap = {
        xs: 'text-sm w-5 h-5',
        sm: 'text-lg w-6 h-6',
        md: 'text-2xl w-8 h-8',
        lg: 'text-3xl w-10 h-10',
        xl: 'text-5xl w-14 h-14',
    }

    return (
        <span
            className={`inline-flex items-center justify-center select-none ${sizeMap[size] || sizeMap.md} ${animClass}`}
            role="img"
            aria-label="weather icon"
        >
            {icon}
        </span>
    )
}

/**
 * Large Hero Weather Icon — for the main weather card
 * Includes ambient glow ring effect matching the weather type
 */
export function HeroWeatherIcon({ code = 0, isDay = 1, rainProb = 0, weatherMode = 'clear' }) {
    let effectiveCode = code 
    let effectiveRainProb = rainProb
    if (weatherMode === 'rainy' && effectiveRainPRob < 40 && effectiveCode < 50) { 
        effectiveCode = 61
        effectiveRainProb = 75
    } else if (weatherMode === 'stormy' && effectiveCode < 95) {
        effectiveCode = 95
        effectiveRainProb = 90
    }
    
    const icon = getWeatherIcon(code, isDay, rainProb)
    const animClass = getAnimationClass(code, rainProb, isDay)

    const glowColors = {
        clear: 'bg-sky-400/20 shadow-sky-400/30',
        rainy: 'bg-blue-400/20 shadow-blue-400/30',
        stormy: 'bg-violet-400/20 shadow-violet-400/30',
        hot: 'bg-amber-400/20 shadow-amber-400/30',
        foggy: 'bg-slate-400/15 shadow-slate-400/20',
        cloudy: 'bg-zinc-400/15 shadow-zinc-400/20',
        snowy: 'bg-sky-300/20 shadow-sky-300/30',
    }

    const glow = glowColors[weatherMode] || glowColors.clear

    return (
        <div className="relative flex items-center justify-center">
            {/* Ambient glow ring */}
            <div className={`absolute w-20 h-20 rounded-full blur-xl ${glow} animate-pulse`} />

            {/* Icon */}
            <span
                className={`relative text-5xl select-none ${animClass}`}
                role="img"
                aria-label="weather icon"
            >
                {icon}
            </span>
        </div>
    )
}