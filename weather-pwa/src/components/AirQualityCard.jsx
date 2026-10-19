// src/components/AirQualityCard.jsx
import { getAQILevel } from '../hooks/useWeather'
import { useTheme } from '../context/ThemeContext'

export default function AirQualityCard({ data, loading }) {
    const { theme, p } = useTheme()
    const isDark = theme === 'dark'
    const accent = p ? p('accent') : '#10b981'

    if (loading) {
        return (
            <div className={`backdrop-blur-xl rounded-3xl p-4 border mb-6 animate-pulse h-40 flex items-center justify-center transition-all ${
                isDark 
                    ? 'bg-slate-900/40 border-white/10' 
                    : 'bg-white/60 border-white/60 shadow-lg shadow-slate-200/50'
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
        <div className={`backdrop-blur-xl rounded-3xl p-4 border mb-6 transition-all duration-300 shadow-xl ${
            isDark 
                ? 'bg-slate-900/45 border-white/10 shadow-black/40' 
                : 'bg-white/70 border-white/80 shadow-slate-200/60'
        }`}>
            {/* Header: Title & Status Badge */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        Air Quality Index
                    </span>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${aqiInfo.bgColor} ${aqiInfo.boderColor} ${aqiInfo.color}`}>
                    {aqiInfo.level} · {aqi} 
                </span>
            </div>

            {/* AQI Score & Status Label */}
            <div className="flex items-baseline space-x-2 mb-2">
                <span className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {aqi}
                </span>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    US AQI
                </span>
                <span className={`text-xs font-bold ml-auto ${aqiInfo.color}`}>
                    {aqiInfo.label}
                </span>
            </div>

            {/* Continuous Color Gradient Bar with Needle Marker */}
            <div className={`relative w-full h-2.5 rounded-full overflow-hidden mb-3.5 ${
                isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-500" />
                <div 
                    className={`absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-lg transform -translate-x-1/2 border-2 ${
                        isDark ? 'border-slate-900' : 'border-slate-300'
                    }`}
                    style={{ left: `${gaugePercent}%` }}
                />
            </div>

            {/* Health Recommendation Banner */}
            <p className={`text-xs leading-relaxed mb-4 rounded-2xl p-3 border backdrop-blur-md transition-all ${
                isDark 
                    ? 'text-slate-300/90 bg-white/5 border-white/10' 
                    : 'text-slate-700 bg-emerald-50/60 border-emerald-200/60'
            }`}>
                💡 <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Advice:</span> {aqiInfo.advice}
            </p>

            {/* Pollutant Sub-metrics Grid (PM2.5, PM10, Ozone) */}
            <div className={`grid grid-cols-3 gap-2.5 pt-3 border-t ${
                isDark ? 'border-white/10' : 'border-slate-200/60'
            }`}>
                {/* PM2.5 */}
                <div className={`rounded-2xl p-2.5 text-center transition-all ${
                    isDark ? 'bg-white/5 border border-white/5' : 'bg-white/80 border border-slate-200/70 shadow-sm'
                }`}>
                    <p className={`text-[10px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        PM2.5
                    </p>
                    <p className="text-base font-black text-sky-400 mt-0.5">{pm2_5}</p>
                    <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>µg/m³</p>
                </div>

                {/* PM10 */}
                <div className={`rounded-2xl p-2.5 text-center transition-all ${
                    isDark ? 'bg-white/5 border border-white/5' : 'bg-white/80 border border-slate-200/70 shadow-sm'
                }`}>
                    <p className={`text-[10px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        PM10
                    </p>
                    <p className="text-base font-black text-emerald-400 mt-0.5">{pm10}</p>
                    <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>µg/m³</p>
                </div>

                {/* Ozone */}
                <div className={`rounded-2xl p-2.5 text-center transition-all ${
                    isDark ? 'bg-white/5 border border-white/5' : 'bg-white/80 border border-slate-200/70 shadow-sm'
                }`}> 
                    <p className={`text-[10px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Ozone
                    </p> 
                    <p className="text-base font-black text-amber-400 mt-0.5">{ozone}</p>
                    <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>µg/m³</p>
                </div>
            </div>
        </div> 
    )
}