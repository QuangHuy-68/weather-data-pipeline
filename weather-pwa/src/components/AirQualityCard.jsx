import { getAQILevel } from '../hooks/useWeather'

export default function AirQualityCard({ data, loading }) {
    if (loading) {
        return (
            <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-4 border border-slate-700/50 mb-6 animate-pulse h-40 flex items-center justify-center">
                <p className="text-slate-400 text-xs">Loading air quality data...</p>
            </div>
        )
    }

    if (!data) return null

    const { aqi, pm2_5, pm10, ozone } = data
    const aqiInfo = getAQILevel(aqi)

    // Percentage for indicator pin on 0-300 AQI scale
    const gaugePercent = Math.min(100, Math.max(2, (aqi / 300) * 100))

    return (
        <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-4 border border-slate-700/50 mb-6">
            
            {/* Header: Title & Status Badge */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3 text-slate-300">
                    <span className="text-base">🍃</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Air Quality Index</span>
                </div>

                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${aqiInfo.bgColor} ${aqiInfo.boderColor} ${aqiInfo.color}`}>
                    {aqiInfo.level} · {aqi} 
                </span>
            </div>

            {/* AQI Score & Status Label */}
            <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-black text-white">{aqi}</span>
                <span className="text-xs text-slate-400 font-medium">US AQI</span>
                <span className={`text-xs font-semibold ml-auto ${aqiInfo.color}`}>
                    {aqiInfo.label}
                </span>
            </div>

            {/* Continuous Color Gradient Bar with Needle Marker */}
            <div className="relative w-full h-2 rounded-full bg-slate-700/60 overflow-hidden mb-3">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-500" />
                <div 
                    className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md transform -translate-x-1/2 border border-slate-900"
                    style={{ left: `${gaugePercent}%` }}
                />
            </div>

            {/* Health Recommendation Banner */}
            <p className="text-[11px] text-slate-300/90 leading-relaxed mb-4 bg-slate-900/40 rounded-xl p-2.5 border border-slate-700/30">
                💡 <span className="font-medium text-slate-200">Advice:</span> {aqiInfo.advice}
            </p>

            {/* Pollutant Sub-metrics Grid (PM2.5, PM10, Ozone) */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/40">
            
                {/* PM2.5 (Fine particulate matter) */}
                <div className="bg-slate-900/30 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">PM2.5</p>
                    <p className="text-sm font-bold text-sky-400 mt-0.5">{pm2_5}</p>
                    <p className="text-[9px] text-slate-500">µg/m³</p>
                </div>

                {/* PM10 (Coarse particulate matter) */}
                <div className="bg-slate-900/30 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">PM10</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{pm10}</p>
                    <p className="text-[9px] text-slate-500">µg/m³</p>
                </div>

                {/* Ozone (O3) */}
                <div className="bg-slate-900/30 rounded-xl p-2 text-center"> 
                    <p className="text-[10px] text-slate-400 font-medium">Ozone (O₃)</p> 
                    <p className="text-sm font-bold text-amber-400 mt-0.5">{ozone}</p>
                    <p className="text-[9px] text-slate-500">µg/m³</p>
                </div>
            </div>
        </div> 
    )
}