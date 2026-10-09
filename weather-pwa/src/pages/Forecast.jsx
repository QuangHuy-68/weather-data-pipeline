import { useForecast } from '../hooks/useWeather'
import { useTheme } from '../context/ThemeContext'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

export default function Forecast() {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    const { data: forecast, loading } = useForecast(24)

    const chartData = forecast?.predictions?.map(p => ({
        time: p.time.slice(11, 16), 
        actual: p.actual_temperature,
        predicted: p.predicted_temperature
    })) || []

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <div className="max-w-3xl mx-auto p-4 md:p-8 pb-28">
                {/* Header Row: Badge + Theme Switcher */}
                <div className="flex items-center justify-between mb-4 pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-full border border-purple-400/20">
                        🤖 Machine Learning
                    </span>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                            isDark
                                ? 'bg-slate-800/80 text-amber-300 border-slate-700/60 hover:bg-slate-700 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm shadow-slate-200/50'
                        }`}
                        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        <span>{isDark ? "☀️" : "🌙"}</span>
                        <span className="text-[11px] font-semibold">{isDark ? "Light" : "Dark"}</span>
                    </button>
                </div>

                {/* Title & Subtitle */}
                <div className="mb-6">
                    <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        AI Temperature Forecasting
                    </h1>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Random Forest Regressor 24-hour predictive time series
                    </p>
                </div>

                {loading ? (
                    <div className={`animate-pulse rounded-3xl h-64 border flex items-center justify-center ${
                        isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-slate-200/60 border-slate-300'
                    }`}>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Loading AI forecast results...
                        </p>
                    </div>
                ) : forecast ? (
                    <div className="space-y-4">
                        {/* Algorithm Info Card */}
                        <div className={`backdrop-blur-md rounded-2xl p-4 border flex justify-between items-center transition-all ${
                            isDark 
                                ? 'bg-slate-800/40 border-slate-700/50' 
                                : 'bg-white/80 border-slate-200/80 shadow-sm'
                        }`}>
                            <div>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Algorithm</p>
                                <p className={`text-sm font-semibold mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    Random Forest Regressor
                                </p>
                            </div>

                            <span className="text-xs bg-emerald-400/10 text-emerald-500 border border-emerald-400/20 px-2.5 py-1 rounded-full font-medium">
                                Latency: 24h
                            </span>
                        </div>

                        {/* Chart Card */}
                        <div className={`backdrop-blur-md rounded-3xl p-4 border shadow-xl transition-all ${
                            isDark 
                                ? 'bg-slate-800/40 border-slate-700/50' 
                                : 'bg-white/80 border-slate-200/80 shadow-sm shadow-slate-200/50'
                        }`}>
                            <h2 className={`text-sm font-semibold mb-4 flex items-center ${
                                isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}>
                                <span className="mr-2">📊</span> 
                                Actual vs. AI Prediction (°C)
                            </h2>

                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={chartData}>
                                    <CartesianGrid 
                                        strokeDasharray="3 3" 
                                        stroke={isDark ? '#334155' : '#e2e8f0'} 
                                        opacity={0.7} 
                                    />
                                    <XAxis 
                                        dataKey="time" 
                                        stroke={isDark ? '#94a3b8' : '#64748b'} 
                                        tick={{ fontSize: 10 }} 
                                        interval={3} 
                                    />
                                    <YAxis 
                                        stroke={isDark ? '#94a3b8' : '#64748b'} 
                                        tick={{ fontSize: 10 }} 
                                        domain={['auto', 'auto']} 
                                        width={25} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                                            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
                                            color: isDark ? '#f8fafc' : '#0f172a',
                                            borderRadius: '12px', 
                                            fontSize: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                        }} 
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="actual" 
                                        stroke="#38bdf8" 
                                        strokeWidth={2.5} 
                                        strokeDasharray="4 4" 
                                        name="AI Forecast (°C)" 
                                        dot={false} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-500 text-sm">
                        ⚠️ Prediction data not found. Ensure the `ml_predict` step has run in the pipeline!
                    </div>
                )}
            </div>
        </div>
    )
}