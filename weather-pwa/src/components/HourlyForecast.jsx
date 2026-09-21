import { getWeatherIcon } from '../hooks/useWeather'

export default function HourlyForecast({ data = [], loading = false }) {
    if (loading) {
        return (
            <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-4 border border-slate-700/50 mb-6 animate-pulse h-36 flex items-center justify-center">
                <p className="text-slate-400 text-xs">Loading 24-hour forecast...</p>
            </div>
        )
    }

    if (!data || data.length === 0) return null

    return (
        <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-4 border border-slate-700/50 mb-6 w-full min-w-0 overflow-hidden">
            {/* Header: Title */}
            <div className="flex items-center space-x-2 border-b border-slate-700/40 pb-2.5 mb-3 text-slate-400">
                <span className="text-sm">🕒</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">24-Hour Forecast</span>
            </div>

            {/* Horizontal Timeline Scroll */}
            <div className="flex items-center space-x-4 overflow-x-auto pb-1.5 scrollbar-none"
                 style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {data.map((item, index) => {
                    const icon = getWeatherIcon(item.code, item.isDay)
                    const isNow = item.displayTime === 'Now'

                    return (
                        <div
                            key={index}
                            className="flex flex-col items-center flex-shrink-0 min-w-[52px] py-1 space-y-1.5"
                        >
                            {/* Time */}
                            <span className={`text-xs ${isNow ? 'text-sky-400 font-bold' : 'text-slate-300 font-medium'}`}>{item.displayTime}</span>
                            
                            {/* Weather Icon */}
                            <span className="text-2xl select-none my-0.5">{icon}</span>

                            {/* Rain Probability (if > 10%) */}
                            <div className="h-4 flex items-center justify-center">
                                {item.rainProb > 10 ? (
                                    <span className="text-[10px] font-bold text-sky-400 tracking-tight">{item.rainProb}%</span>
                                ) : (
                                    <span className="text-[10px] text-transparent select-none">-</span>
                                )} 
                            </div>

                            {/* Temperature */}
                            <span className="text-sm font-bold text-white">{item.temp}°</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}