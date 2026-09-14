import { useWeatherCurrent, useWeatherDaily } from "../hooks/useWeather"
import {
    AreaChart, 
    Area,
    BarChart, 
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

export default function Home() {
    const { data: current,
            loading: loadingCurrent,
            error: currentError } = useWeatherCurrent()

    const { data: daily,
            loading: loadingDaily } = useWeatherDaily(7)   

    
    const getWeatherAlert = () => { 
        if (!current) return null
        if (current.precipitation > 0)
        {
            return {
                type: "rain",
                bg: "bg-blue-500/20 border-blue-500/40 text-blue-300",
                icon: "🌧️", 
                title: "Rain is forecast.",
                desc: "There is scattered light rain in the area. Don't forget to bring an umbrella or raincoat when you go out!"
            }
        }

        if (current.temperature >= 33) {
            return {
                type: "hot",
                bg: "bg-orange-500/20 border-orange-500/40 text-orange-300",
                icon: "☀️",
                title: "Heatwave warning",
                desc: "The outdoor temperature is quite high. Remember to apply sunscreen and stay hydrated!"
            }
        }

        return {
            type: "good",
            bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", 
            icon: "🌤️",
            title: "Ideal weather",
            desc: "The weather is cool and dry—perfect for outdoor sports!"
        }
    }

    const alert = getWeatherAlert()

    const formattedDaily = daily?.map(d => ({
        ...d,
        shortDate: d.date ? d.date.slice(5) : "", 
        rain: d.total_precipitation ?? 0,
        temp: d.avg_temperature ? Math.round(d.avg_temperature * 10) / 10 : 0 
    })) || []

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to slate-950 text-white p-4 pb-24 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6 pt-2">
                <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-400/10 px-2.5 py-1 rounded-full border border-sky-400/20">📍 Ho Chi Minh City</span>
                    <h1 className="text-2xl font-bold text-white mt-2">Current Weather</h1>
                </div>

                <div className="text-right">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                    <span className="text-xs text-slate-400">Live API</span>
                </div>
            </div>

            {loadingCurrent ? (
                <div className="animate-pulse bg-slate-800/60 rounded-3xl h-48 border border-slate-700/50 mb-6 flex items-center justify-center">
                    <p className="text-slate-400 text-sm">Loading meteorological data...</p>
                </div>
            ) : current ? (
                <>
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500/20 via-slate-800/80 to-slate-900/90 border border-sky-500/30 p-6 mb-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex-justify-between items-start">
                            <div>
                                <p className="text-slate-400 text-sm">Current temperature</p>
                                <div className="flex items-baseline space-x-2 mt-1">
                                    <span className="text-6xl font-black tracking-tight text-white">{current.temperature}</span>
                                    <span className="text-xl font-medium text-sky-400">C</span>
                                </div>

                                <p className="text-slate-300 font-medium mt-2 flex items-center">
                                    <span className="mr-1.5">{current.precipitation > 0 ? "🌧️ Light rain" : "🌤️ Cloudy, cool"}</span>
                                </p>
                            </div>

                            <div className="text-5xl select-none">{current.precipitation > 0 ? "🌧️" : current.temperature > 30 ? "☀️" : "⛅"}</div>
                        </div> 

                        <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between text-xs text-slate-400">
                            <span>🕒 Updated: {current.time?.replace("T", " ") || "Today"}</span>
                            <span>Station: Tan Son Nhat</span>
                        </div>
                    </div>                

                    {alert && (
                        <div className={`rounded-2xl p-4 mb-6 border ${alert.bg} flex items-start space-x-3 transition-all`}>
                            <span className="text-2xl">{alert.icon}</span>
                            <div>
                                <h4 className="font-semibold text-sm">{alert.title}</h4>
                                <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{alert.desc}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="p-1.5 rounded-lg bg-orange-400/10 text-orange-400 text-sm">🌡️</span>
                                <span className="text-xs text-slate-400 font-medium">Temperature</span>
                            </div>

                            <p className="text-2xl font-bold text-orange-400">{current.temperature}°C</p>
                            <p className="text-[10px] text-slate-500 mt-1">Feels like {Math.round(current.temperature + 1)}°C</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="p-1.5 rounded-lg bg-blue-400/10 text-blue-400 text-sm">💧</span>
                                <span className="text-xs text-slate-400 font-medium">Humidity</span>
                            </div>

                            <p className="text-2xl font-bold text-blue-400">{current.humidity}%</p>
                            <p className="text-[10px] text-slate-500 mt-1"> {current.humidity > 80 ? "High humidity" : "Well-ventilated"}</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 text-sm">💨</span>
                                <span className="text-xs text-slate-400 font-medium">Wind Speed</span>
                            </div>

                            <p className="text-2xl font-bold text-emerald-400">{current.wind_speed ?? 0}
                                <span className="text-xs font-normal">km/h</span>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">A light, gentle breeze.</p>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50">
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="p-1.5 rounded-lg bg-sky-400/10 text-sky-400 text-sm">🌧️</span>
                                <span className="text-xs text-slate-400 font-medium">Rainfall</span>
                            </div>

                            <p className="text-2xl font-bold text-sky-400">{current.precipitation} 
                                <span className="text-xs font-normal">mm</span>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">Measured over the past hour</p>
                        </div>
                    </div>
                </>
            ) : (

                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-red-400 text-sm">⚠️ Unable to load weather data. Please check the FastAPI connection!</div>
            )}


            {/* Chart 1 */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-4 border border-slate-700/50 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-semibold text-slate-200 flex items-center">
                        <span className="mr-2">📈</span>
                        7-Day Temperature Trend
                    </h2>

                    <span className="text-[11px] text-orange-400/90 font-medium bg-orange-400/10 px-2 py-0.5 rounded-md">AVG Temperature (°C)</span>
                </div>

                {loadingDaily ? (
                    <p className="text-slate-400 text-xs py-8 text-center">Loading temperature chart...</p>
                ) : (

                    <ResponsiveContainer width="100%" height={170}>
                        <AreaChart data={formattedDaily}>
                            <defs>
                                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey="shortDate" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} width={25} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }} />
                            <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2.5} fill="url(#tempGradient)" name="AVG Temperature (°C)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>


            {/* Chart 2 */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-4 border border-slate-700/50">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-semibold text-slate-200 flex items-center">
                        <span className="mr-2">🌧️</span>
                        Daily Rainfall (mm)
                    </h2>

                    <span className="text-[11px] text-sky-400 font-medium bg-sky-400 font-medium bg-sky-400/10 px-2 py-0.5 rounded-md">
                        Total Rainfall (mm)
                    </span>
                </div>

                {loadingDaily ? (
                    <p className="text-slate-400 text-xs py-8 text-center">Loading rainfall data...</p>
                ) : (

                    <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={formattedDaily}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey="shortDate" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} width={25} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }} />
                            <Bar dataKey="rain" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Rainfall (mm)" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
}