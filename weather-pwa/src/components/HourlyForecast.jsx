import { getWeatherIcon } from '../hooks/useWeather'
import { useTheme } from '../context/ThemeContext'

export default function HourlyForecast({ data = [], loading = false }) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    if (loading) {
        return (
            <div className={`backdrop-blur-md rounded-3xl p-4 border mb-6 animate-pulse h-36 flex items-center justify-center transition-all ${
                isDark 
                    ? 'bg-slate-800/40 border-slate-700/50' 
                    : 'bg-white/80 border-slate-200/80 shadow-sm'
            }`}>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Loading 24-hour forecast...
                </p>
            </div>
        )
    }

    if (!data || data.length === 0) return null

    return (
        <div className={`backdrop-blur-md rounded-3xl p-4 border mb-6 w-full min-w-0 overflow-hidden transition-all duration-300 ${
            isDark 
                ? 'bg-slate-800/40 border-slate-700/50' 
                : 'bg-white/80 border-slate-200/80 shadow-sm shadow-slate-200/50'
        }`}>
            {/* Header: Title */}
            <div className={`flex items-center space-x-2 border-b pb-2.5 mb-3 ${
                isDark ? 'border-slate-700/40 text-slate-300' : 'border-slate-100 text-slate-700'
            }`}>
                <span className="text-sm">🕒</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                    24-Hour Forecast
                </span>
            </div>

            {/* Horizontal Timeline Scroll */}
            <div 
                className="flex items-center space-x-4 overflow-x-auto pb-1.5 scrollbar-none"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {data.map((item, index) => {
                    const icon = getWeatherIcon(item.code, item.isDay, item.rainProb)
                    const isNow = item.displayTime === 'Now'

                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center flex-shrink-0 min-w-[52px] py-1 space-y-1.5"
                        >
                            {/* Time */}
                            <span className={`text-xs ${
                                isNow 
                                    ? isDark ? 'text-sky-400 font-bold' : 'text-sky-600 font-bold'
                                    : isDark ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'
                            }`}>
                                {item.displayTime}
                            </span>
                            
                            {/* Weather Icon */}
                            <span className="text-2xl select-none my-0.5">{icon}</span>

                            {/* Rain Probability (if > 10%) */}
                            <div className="h-4 flex items-center justify-center">
                                {item.rainProb > 10 ? (
                                    <span className={`text-[10px] font-bold tracking-tight ${
                                        isDark ? 'text-sky-400' : 'text-sky-600'
                                    }`}>
                                        {item.rainProb}%
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-transparent select-none">-</span>
                                )} 
                            </div>

                            {/* Temperature */}
                            <span className={`text-sm font-bold ${
                                isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                                {item.temp}°
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}