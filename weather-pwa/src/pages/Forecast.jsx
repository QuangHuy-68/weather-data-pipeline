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
        <div className="min-h-screen bg-slate-900 text-white p-4 pb-20">
            <h1 className="text-2xl font-bold text-sky-400 mb-2">🤖 AI Forecast</h1>
            <p className="text-slate-400 text-sm mb-6">24-Hour Temperature Forecasting Using Random Forest Machine Learning</p>
            {loading ? (
                <p className="text-slate-400">Loading forecast data...</p>
            ) : forecast ? (
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                    <h2 className="text-sm text-slate-400 mb-4">Model: {forecast.model_name}</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="time" stroke="#94a33b8" tick={{ fontSize: 10 }} interval={3} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                            <Legend />
                            <Line type="monotone" dataKey="actual" stroke="#3b82f6" name="Reality (°C)" dot={false} />
                            <Line type="monotone" dataKey="predicted" stroke="#f97316" strokeDasharray="5 5" name="AI Forecast (°C)" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (

                <p className="text-red-400">No ML Data Found. Let's run `pipeline.py --steps ml_train,ml_predict`!</p>
            )}
        </div>
    )
}
