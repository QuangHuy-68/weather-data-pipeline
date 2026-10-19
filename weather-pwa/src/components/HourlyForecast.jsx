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
            {/* Header: Title with dot accent & subtitle */}
            <div className={`flex items-center justify-between border-b pb-2.5 mb-3 ${
                isDark ? 'border-white/10 text-slate-300' : 'border-slate-200/60 text-slate-700'
            }`}>
                <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        24-Hour Forecast
                    </span>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                    Solar & Rain Timeline
                </span>
            </div>

            {/* Horizontal Timeline Scroll */}
            <div 
                className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {data.map((item, index) => {
                    // 1. Thẻ đặc biệt: Cột mốc Thiên văn (Sunrise / Sunset)
                    if (item.isSunEvent) {
                        const isSunrise = item.eventType === 'sunrise'
                        return (
                            <div
                                key={`sun-${index}`}
                                className={`flex flex-col items-center justify-between flex-shrink-0 min-w-[62px] py-2 px-1.5 rounded-2xl transition-all duration-300 border ${
                                    isSunrise
                                        ? isDark
                                            ? 'bg-amber-500/10 border-amber-400/30 text-amber-200 shadow-sm shadow-amber-950/20'
                                            : 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-sm shadow-amber-100'
                                        : isDark
                                            ? 'bg-purple-500/10 border-purple-400/30 text-purple-200 shadow-sm shadow-purple-950/20'
                                            : 'bg-purple-50/90 border-purple-300 text-purple-900 shadow-sm shadow-purple-100'
                                }`}
                            >
                                {/* Giờ thiên văn */}
                                <span className={`text-[11px] font-bold mb-1 tracking-tight ${
                                    isSunrise 
                                        ? isDark ? 'text-amber-300' : 'text-amber-700'
                                        : isDark ? 'text-purple-300' : 'text-purple-700'
                                }`}>
                                    {item.displayTime}
                                </span>

                                {/* Minimalist SVG Icon: Sunrise / Sunset */}
                                <div className="my-1 flex items-center justify-center h-6 w-6">
                                    {isSunrise ? (
                                        <svg className="w-5 h-5 text-amber-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="3" y1="18" x2="21" y2="18" />
                                            <path d="M7 18 A5 5 0 0 1 17 18" />
                                            <line x1="12" y1="6" x2="12" y2="2" />
                                            <polyline points="9 5 12 2 15 5" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-purple-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="3" y1="18" x2="21" y2="18" />
                                            <path d="M7 18 A5 5 0 0 1 17 18" />
                                            <line x1="12" y1="2" x2="12" y2="6" />
                                            <polyline points="9 3 12 6 15 3" />
                                        </svg>
                                    )}
                                </div>

                                {/* Nhãn sự kiện */}
                                <div className="h-4 flex items-center justify-center my-0.5">
                                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                                        isSunrise
                                            ? isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-200/60 text-amber-800'
                                            : isDark ? 'bg-purple-400/20 text-purple-300' : 'bg-purple-200/60 text-purple-800'
                                    }`}>
                                        {item.label}
                                    </span>
                                </div>

                                {/* Nhiệt độ thời điểm đó */}
                                <span className={`text-sm font-black tracking-tight ${
                                    isDark ? 'text-white/90' : 'text-slate-800'
                                }`}>
                                    {item.temp}°
                                </span>
                            </div>
                        )
                    }

                    // 2. Thẻ giờ tiêu chuẩn (Hourly Card)
                    const isNow = item.displayTime === 'Now'
                    return (
                        <div
                            key={`hour-${index}`}
                            className={`flex flex-col items-center flex-shrink-0 min-w-[56px] py-2 px-1.5 rounded-2xl transition-all duration-300 ${
                                isNow
                                    ? isDark
                                        ? 'bg-white/10 border border-white/20 shadow-md shadow-black/20'
                                        : 'bg-white/90 border border-sky-200 shadow-sm shadow-sky-100'
                                    : 'hover:bg-white/5'
                            }`}
                        >
                            {/* 1. Giờ */}
                            <span className={`text-[11px] mb-1 ${
                                isNow 
                                    ? isDark ? 'text-sky-300 font-extrabold' : 'text-sky-600 font-extrabold'
                                    : isDark ? 'text-slate-400 font-medium' : 'text-slate-600 font-medium'
                            }`}>
                                {item.displayTime}
                            </span>

                            {/* 2. Weather Icon */}
                            <div className="my-1">
                                <WeatherIcon 
                                    code={item.code} 
                                    isDay={item.isDay} 
                                    rainProb={item.rainProb} 
                                    size="sm" 
                                />
                            </div>

                            {/* 3. Cột nước đo lượng mưa vi mô (Precipitation Micro-Bar) & Tỉ lệ % */}
                            <div className="h-4 flex items-center justify-center space-x-1 my-0.5">
                                {item.rainProb > 0 ? (
                                    <>
                                        {/* Ống nước vi mô */}
                                        <div className={`w-1 h-3 rounded-full overflow-hidden flex flex-col justify-end ${
                                            isDark ? 'bg-white/10' : 'bg-slate-200'
                                        }`}>
                                            <div 
                                                className="w-full rounded-full bg-gradient-to-t from-sky-500 to-cyan-300 transition-all duration-300"
                                                style={{ height: `${Math.max(25, item.rainProb)}%` }}
                                            />
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-tight ${
                                            isDark ? 'text-sky-400' : 'text-sky-600'
                                        }`}>
                                            {item.rainProb}%
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-transparent select-none">-</span>
                                )} 
                            </div>

                            {/* 4. Nhiệt độ */}
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