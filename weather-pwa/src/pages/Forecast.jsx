import { useForecast } from '../hooks/useWeather'
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
    const { data: forecast, loading } = useForecast(24)

    const chartData = forecast?.predictions?.map(p => ({
        time: p.time.slice(11, 16), 
        actual: p.actual_temperature,
        predicted: p.predicted_temperature
    })) || []

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4 pb-24 max-w-md mx-auto">
            {/* Header */}
            <div className="mb-6 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2.5 py-1 rounded-full border border-purple-400/20">🤖 Machine Learning</span>

                <h1 className="text-2xl font-bold text-white mt-2">AI Temperature Forecasting</h1>

                <p className="text-slate-400 text-xs mt-1">Random Forest model for the next 24 hours (time series)</p>
            </div>

            {loading ? (
                <div className="animate-pulse bg-slate-800/60 rounded-3xl h-64 border border-slate-700/50 flex items-center justify-center">
                    <p className="text-slate-400 text-sm">Loading AI forecast results...</p>
                </div>
            ) : forecast ? (
                <div className="space-y-4">
                    <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-slate-400">Algorithm</p>
                            <p className="text-sm font-semibold text-slate-200 mt-0.5">Random Forest Regressor</p>
                        </div>

                        <span className="text-xs bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2.5 py-1 rounded-full font-medium">Latency: 24h</span>
                    </div>

                    <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-4 border border-slate-700/50 shadow-xl">
                        <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center">
                            <span className="mr-2">📊</span> 
                            Actual vs. AI Prediction (°C)
                        </h2>

                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 10 }} interval={3} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} width={25} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                <Line type="monotone" dataKey="actual" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="4 4" name="AI Forecast (°C)" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">⚠️ Prediction data not found. Ensure the `ml_predict` step has run in the pipeline!</div>
            )}
        </div>
    )
}
