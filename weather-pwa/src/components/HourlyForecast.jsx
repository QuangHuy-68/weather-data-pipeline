import { useTheme } from '../context/ThemeContext'
import WeatherIcon from './WeatherIcons'

export default function HourlyForecast({ data = [], loading = false }) {
    const { theme, p } = useTheme()
    const isDark = theme === 'dark'
    const accent = p ? p('accent') : '#38bdf8'

    if (loading) {
        return (
            <div className={`backdrop-blur-xl rounded-3xl p-4 border mb-6 animate-shimmer shadow-xl ${
                isDark 
                    ? 'bg-slate-900/40 border-white/10' 
                    : 'bg-white/60 border-white/80 shadow-slate-200/50'
            }`}>
                <div className={`h-3 w-32 rounded-full mb-3.5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                <div className="flex items-center space-x-3 overflow-hidden pb-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={`flex flex-col items-center flex-shrink-0 min-w-[56px] py-2 px-1.5 rounded-2xl space-y-2 ${isDark ? 'bg-white/5' : 'bg-white/50'}`}>
                            <div className={`h-2.5 w-8 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                            <div className={`w-7 h-7 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                            <div className={`h-2.5 w-6 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                            <div className={`h-4 w-7 rounded-md ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (!data || data.length === 0) return null

    return (
        <div className={`backdrop-blur-xl rounded-3xl p-4 border mb-6 w-full min-w-0 overflow-hidden transition-all duration-300 shadow-xl ${
            isDark 
                ? 'bg-slate-900/45 border-white/10 shadow-black/40' 
                : 'bg-white/70 border-white/80 shadow-slate-200/60'
        }`}>
            {/* Header: Title with dot accent */}
            <div className={`flex items-center space-x-2 border-b pb-2.5 mb-3 ${
                isDark ? 'border-white/10 text-slate-300' : 'border-slate-200/60 text-slate-700'
            }`}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
                <span className="text-xs font-bold uppercase tracking-wider">
                    24-Hour Forecast
                </span>
            </div>
            {/* Horizontal Timeline Scroll */}
            <div 
                className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {data.map((item, index) => {
                    const isNow = item.displayTime === 'Now'
                    return (
                        <div
                            key={index}
                            className={`flex flex-col items-center flex-shrink-0 min-w-[56px] py-2 px-1.5 rounded-2xl transition-all duration-300 ${
                                isNow
                                    ? isDark
                                        ? 'bg-white/10 border border-white/20 shadow-md shadow-black/20'
                                        : 'bg-white/90 border border-sky-200 shadow-sm shadow-sky-100'
                                    : 'hover:bg-white/5'
                            }`}
                        >
                            {/* 1. Time */}
                            <span className={`text-[11px] mb-1 ${
                                isNow 
                                    ? isDark ? 'text-sky-300 font-extrabold' : 'text-sky-600 font-extrabold'
                                    : isDark ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'
                            }`}>
                                {item.displayTime}
                            </span>
                            {/* 2. Animated Weather Icon */}
                            <div className="my-1">
                                <WeatherIcon 
                                    code={item.code} 
                                    isDay={item.isDay} 
                                    rainProb={item.rainProb} 
                                    size="sm" 
                                />
                            </div>
                            {/* 3. Rain Probability (nếu > 0) */}
                            <div className="h-4 flex items-center justify-center my-0.5">
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
                            {/* 4. Temperature */}
                            <span className={`text-sm font-black tracking-tight ${
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