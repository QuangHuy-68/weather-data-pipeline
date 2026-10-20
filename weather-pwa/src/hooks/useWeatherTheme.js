// src/hooks/useWeatherTheme.js

/**
 * Dedicated weather palettes for each meteorological state.
 * Fully supports dual Dark / Light mode styling tokens.
 */
export const WEATHER_PALETTES = {
    // 1. Clear / Sunny Sky (Glassmorphism trên nền trời xanh)
    clear: {
        name: 'Clear Sky',
        accent: '#38bdf8', // Sky 400
        gradient: {
            dark: 'from-white/20 via-white/10 to-sky-950/20 backdrop-blur-xl',
            light: 'from-white/25 via-white/15 to-sky-900/15 backdrop-blur-xl',
        },
        border: {
            dark: 'border-white/25',
            light: 'border-white/30',
        },
        badge: {
            dark: 'bg-white/15 text-white border-white/25',
            light: 'bg-white/20 text-white border-white/30',
        },
        glow: 'shadow-sky-500/20',
        heroEmoji: '☀️'
    },

    // 2. Rainy / Precipitation
    rainy: {
        name: 'Rain Showers',
        accent: '#60a5fa', // Blue 400
        gradient: {
            dark: 'from-blue-600/25 via-slate-800/85 to-slate-900/95',
            light: 'from-blue-100/90 via-slate-50 to-blue-50/70',
        },
        border: {
            dark: 'border-blue-500/40',
            light: 'border-blue-200/80',
        },
        badge: {
            dark: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
            light: 'bg-blue-100 text-blue-600 border-blue-200',
        },
        glow: 'shadow-blue-500/25',
        heroEmoji: '🌧️'
    },

    // 3. Thunderstorm / Severe Weather
    stormy: {
        name: 'Thunderstorm',
        accent: '#a78bfa', // Violet 400
        gradient: {
            dark: 'from-violet-700/30 via-slate-900/90 to-slate-950/95',
            light: 'from-violet-100/80 via-slate-50 to-violet-50/60',
        },
        border: {
            dark: 'border-violet-500/40',
            light: 'border-violet-200/80',
        },
        badge: {
            dark: 'bg-violet-400/10 text-violet-400 border-violet-400/20',
            light: 'bg-violet-100 text-violet-600 border-violet-200',
        },
        glow: 'shadow-violet-500/30',
        heroEmoji: '⛈️'
    },

    // 4. Heatwave / Extreme Heat
    hot: {
        name: 'High Heatwave',
        accent: '#fb923c', // Orange 400
        gradient: {
            dark: 'from-amber-500/25 via-slate-800/80 to-slate-900/90',
            light: 'from-amber-100/90 via-white to-orange-50/60',
        },
        border: {
            dark: 'border-amber-500/30',
            light: 'border-amber-200/80',
        },
        badge: {
            dark: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
            light: 'bg-amber-100 text-amber-600 border-amber-200',
        },
        glow: 'shadow-amber-500/20',
        heroEmoji: '🔥'
    },

    // 5. Fog / High Relative Humidity
    foggy: {
        name: 'Fog & Mist',
        accent: '#94a3b8', // Slate 400
        gradient: {
            dark: 'from-slate-600/25 via-slate-800/85 to-slate-900/90',
            light: 'from-slate-200/80 via-white to-slate-100/70',
        },
        border: {
            dark: 'border-slate-500/40',
            light: 'border-slate-300/80',
        },
        badge: {
            dark: 'bg-slate-400/10 text-slate-400 border-slate-500/20',
            light: 'bg-slate-200 text-slate-600 border-slate-300',
        },
        glow: 'shadow-slate-400/15',
        heroEmoji: '🌫️'
    },

    // 6. Overcast / Cloudy
    cloudy: {
        name: 'Overcast & Cloudy',
        accent: '#a1a1aa', // Zinc 400
        gradient: {
            dark: 'from-zinc-500/20 via-slate-800/80 to-slate-900/90',
            light: 'from-zinc-100/80 via-white to-zinc-50/60',
        },
        border: {
            dark: 'border-zinc-500/30',
            light: 'border-zinc-200/80',
        },
        badge: {
            dark: 'bg-zinc-400/10 text-zinc-400 border-zinc-500/20',
            light: 'bg-zinc-100 text-zinc-600 border-zinc-200',
        },
        glow: 'shadow-zinc-400/15',
        heroEmoji: '☁️'
    },

    // 7. Snowfall / Winter Weather
    snowy: {
        name: 'Snowfall',
        accent: '#7dd3fc', // Sky 300
        gradient: {
            dark: 'from-sky-800/20 via-slate-800/85 to-indigo-950/90',
            light: 'from-sky-50/90 via-white to-indigo-50/60',
        },
        border: {
            dark: 'border-sky-400/30',
            light: 'border-sky-200/80',
        },
        badge: {
            dark: 'bg-sky-300/10 text-sky-300 border-sky-400/20',
            light: 'bg-sky-50 text-sky-600 border-sky-200',
        },
        glow: 'shadow-sky-300/20',
        heroEmoji: '❄️'
    }
};

/**
 * Computes the active weather state from real-time meteorological metrics.
 * @param {Object} current - Current weather payload
 * @param {Array} hourly - Hourly forecast timeline array
 * @returns {{ weatherMode: string, palette: Object }}
 */
export function computeWeatherTheme(current, hourly = []) {
    const temp = current?.temperature ?? 28;
    const humidity = current?.humidity ?? 70;
    const precipitation = current?.precipitation ?? 0;
    const rainProb = hourly?.[0]?.rainProb ?? 0;
    const weatherCode = hourly?.[0]?.code ?? 0;

    // 1. Check for Thunderstorm / Severe weather (WMO code >= 95)
    if (weatherCode >= 95) {
        return { weatherMode: 'stormy', palette: WEATHER_PALETTES.stormy };
    }

    // 2. Check for Snowfall (WMO code 71-77: snow / snow grains)
    if (weatherCode >= 71 && weatherCode <= 77) {
        return { weatherMode: 'snowy', palette: WEATHER_PALETTES.snowy };
    }

    // 3. Check for Active Rain or High Rain Probability
    if (precipitation > 0 || rainProb >= 60) {
        return { weatherMode: 'rainy', palette: WEATHER_PALETTES.rainy };
    }

    // 4. Check for Heatwave condition (temperature >= 33°C)
    if (temp >= 33) {
        return { weatherMode: 'hot', palette: WEATHER_PALETTES.hot };
    }

    // 5. Check for Fog / Saturated Humidity
    if (weatherCode === 45 || weatherCode === 48 || (humidity > 90 && temp < 26)) {
        return { weatherMode: 'foggy', palette: WEATHER_PALETTES.foggy };
    }

    // 6. Check for Cloudy / Overcast conditions
    if (weatherCode >= 2 && weatherCode <= 3) {
        return { weatherMode: 'cloudy', palette: WEATHER_PALETTES.cloudy };
    }

    // Default fallback: Clear sky
    return { weatherMode: 'clear', palette: WEATHER_PALETTES.clear };
}