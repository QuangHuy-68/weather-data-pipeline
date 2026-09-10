import { useWeatherCurrent, useWeatherDaily } from "../hooks/useWeather"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function Home() {
    const { data: current, loading: loadingCurrent } = useWeatherCurrent()
    const { data: daily, loading: loadingDaily } = useWeatherDaily(7)

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 pb-20">
            <h1 className="text-2xl font-bold text-sky-400 mb-6">🌦️ Weather Dashboard</h1>

            {/* KPI Cards */}
            {loadingCurrent ? (
                <p className="text-slate-400">Loading current weather data...</p>) : current ? (
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                        <p className="text-slate-400 text-sm">🌡️ Temperature</p>
                        <p className="text-3xl font-bold text-orange-400">{current.temperature}°C</p>
                    </div>

                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                        <p className="text-slate-400 text-sm">💧 Humidity</p>
                        <p className="text-3xl font-bold text-blue-400">{current.humidity}%</p>
                    </div> 

                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                        <p className="text-slate-400 text-sm">💨 Wind</p>
                        <p className="text-3xl font-bold text-green-400">{current.wind_speed ?? 0} km/h</p>
                    </div>  

                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                        <p className="text-slate-400 text-sm">🌧️ Rain</p>
                        <p className="text-3xl font-bold text-sky-400">{current.precipitation} mm</p>
                    </div>
                </div>
                ) : (

                    <p className="text-red-400">Error loading weather data. Let's run FastAPI first!</p>
                )}

                {/* 7-day temperature chart */}
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-6">
                    <h2 className="text-lg font-semibold text-slate-300 mb-4">📈 Temperatures over the last 7 days</h2>
                    {loadingDaily ? (
                        <p className="text-slate-400">Loading daily weather data...</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11}} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="avg_temperature" stroke="#f97316" fill="#f9731620" name="Avg Temp (°C)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
        </div>
    )
}