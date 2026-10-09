import { getAQILevel } from '../hooks/useWeather'
import { useTheme } from '../context/ThemeContext'

export default function AirQualityCard({ data, loading }) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    if (loading) {
        return (
            <div className={`backdrop-blur-md rounded-3xl p-4 border mb-6 animate-pulse h-40 flex items-center justify-center transition-all ${
                isDark 
                    ? 'bg-slate-800/40 border-slate-700/50' 
                    : 'bg-white/80 border-slate-200/80 shadow-sm'
            }`}>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Loading air quality data...
                </p>
            </div>
        )
    }

    if (!data) return null

    const { aqi, pm2_5, pm10, ozone } = data
    const aqiInfo = getAQILevel(aqi)

    // Percentage for indicator pin on 0-300 AQI scale
    const gaugePercent = Math.min(100, Math.max(2, (aqi / 300) * 100))

    return (
        <div className={`backdrop-blur-md rounded-3xl p-4 border mb-6 transition-all duration-300 ${
            isDark 
                ? 'bg-slate-800/40 border-slate-700/50' 
                : 'bg-white/80 border-slate-200/80 shadow-sm shadow-slate-200/50'
        }`}>
            {/* Header: Title & Status Badge */}
            <div className="flex justify-between items-center mb-3">
                <div className={`flex items-center space-x-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span className="text-base">🍃</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                        Air Quality Index
                    </span>
                </div>

                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${aqiInfo.bgColor} ${aqiInfo.boderColor} ${aqiInfo.color}`}>
                    {aqiInfo.level} · {aqi} 
                </span>
            </div>

            {/* AQI Score & Status Label */}
            <div className="flex items-baseline space-x-2 mb-2">
                <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {aqi}
                </span>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    US AQI
                </span>
                <span className={`text-xs font-semibold ml-auto ${aqiInfo.color}`}>
                    {aqiInfo.label}
                </span>
            </div>

            {/* Continuous Color Gradient Bar with Needle Marker */}
            <div className={`relative w-full h-2 rounded-full overflow-hidden mb-3 ${
                isDark ? 'bg-slate-700/60' : 'bg-slate-200'
            }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-500" />
                <div 
                    className={`absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md transform -translate-x-1/2 border ${
                        isDark ? 'border-slate-900' : 'border-slate-300'
                    }`}
                    style={{ left: `${gaugePercent}%` }}
                />
            </div>

            {/* Health Recommendation Banner */}
            <p className={`text-[11px] leading-relaxed mb-4 rounded-xl p-2.5 border transition-all ${
                isDark 
                    ? 'text-slate-300/90 bg-slate-900/40 border-slate-700/30' 
                    : 'text-slate-700 bg-sky-50/70 border-sky-100'
            }`}>
                💡 <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Advice:</span> {aqiInfo.advice}
            </p>

            {/* Pollutant Sub-metrics Grid (PM2.5, PM10, Ozone) */}
            <div className={`grid grid-cols-3 gap-2 pt-2 border-t ${
                isDark ? 'border-slate-700/40' : 'border-slate-100'
            }`}>
                {/* PM2.5 (Fine particulate matter) */}
                <div className={`rounded-xl p-2 text-center transition-all ${
                    isDark ? 'bg-slate-900/30' : 'bg-slate-50 border border-slate-100'
                }`}>
                    <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        PM2.5
                    </p>
                    <p className="text-sm font-bold text-sky-500 mt-0.5">{pm2_5}</p>
                    <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>µg/m³</p>
                </div>

                {/* PM10 (Coarse particulate matter) */}
                <div className={`rounded-xl p-2 text-center transition-all ${
                    isDark ? 'bg-slate-900/30' : 'bg-slate-50 border border-slate-100'
                }`}>
                    <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        PM10
                    </p>
                    <p className="text-sm font-bold text-emerald-500 mt-0.5">{pm10}</p>
                    <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>µg/m³</p>
                </div>

                {/* Ozone (O3) */}
                <div className={`rounded-xl p-2 text-center transition-all ${
                    isDark ? 'bg-slate-900/30' : 'bg-slate-50 border border-slate-100'
                }`}> 
                    <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Ozone (O₃)
                    </p> 
                    <p className="text-sm font-bold text-amber-500 mt-0.5">{ozone}</p>
                    <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>µg/m³</p>
                </div>
            </div>
        </div> 
    )
}