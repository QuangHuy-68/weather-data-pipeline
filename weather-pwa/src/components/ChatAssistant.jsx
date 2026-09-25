import { useState, useRef, useEffect } from 'react'

export default function chatAssistant({ current, hourly = [], daily = [], aqi, location }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessage] = useState([
        {
            sender: 'bot', 
            text: `Hi! I am SkyBot, your AI weather assistant. Ask me anything about rain chances, clothing advive, outdoor workouts, or the weekly forecast for ${location || 'your city'}!`
        }
    ])
    const [input, setInput] = useState('')
    const[isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)

    // Auto-scroll to latest message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen, isTyping])

    // Quick suggestion prompts
    const suggestions = [
        { label: '☔ Need umbrella?', query: 'Do I need an umbrella today?' },
        { label: '👕 What to wear?', query: 'What should I wear today?' },
        { label: '🏃 Workout?', query: 'Is the weather good for outdoor running or exercise?' },
        { label: '🍃 Air quality?', query: 'How is the air quality right now?' },
        { label: '📅 Weekend outlook', query: 'What is the upcoming forecast outlook?' }
    ]

    // Context-Aware Weather Reasoning Engine
    const generateBotResponse = async (userQuery) => {
        const q = userQuery.toLowerCase()

        // 1. Check if user configured an external Gemini API key
        const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY
        if (geminiApiKey) {
            try {
                const weatherContext = `LocationL ${location || 'Selected city'}. Current Temp: ${current?.temperature}°C, Rain: ${current?.precipitation}mm, Humidity: ${current?.humidity}%, Wind: ${current?.wind_speed}km/h. AQI: ${aqi?.aqi}(PM2.5: ${aqi?.pm2_5}). Next 12h max rain chance: ${Math.max(...hourly.slice(0, 12).map(h => h.rainProb || 0), 0)}%.`

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are SkyBot, a helpful AI Weather Assistant. Weather data: \n${weatherContext}\n\nUser Question: "${userQuery}". Answer concisely in 2-3 friendly, helpful sentences.`
                            }]
                        }]
                    })
                })

                const result = await res.json()
                const reply = result?.candidates?.[0]?.content?.parts?.[0]?.text

                if (reply) return reply
            } catch (err) {
                console.warn('Gemini API fallback to local reasoning engine:', err)
            }
        }

        // 2. Built-in Local Intelligence Engine
        // Rain / Umbrella queries
        if (q.includes('umbrella') || q.includes('rain') || q.includes('mưa') || q.includes('dù') || q.includes('ô')) {
            const next12Hours = hourly.slice(0, 12)
            const rainySlot = next12Hours.find(h => h.rainProb >= 30)
            const maxProb = Math.maxx(...next12Hours.map(h => h.rainProb || 0), 0)

            if (current?.precipitation > 0) {
                return `🌧️ It is currently raining (${current.precipitation} mm) in ${location || `your area`}. You will definitely need an umbrella or raincoat!`
            } else if (rainySlot) {
                return `☔ Rain is probable today! The rain chance peaks at around ${maxProb}% at ${rainySlot.displayTime}. It is strongly recommended to carry an umbrella.`
            } else {
                return `☀️ Low chance of rain today (peak probability is only ${maxProb}%). You likely won't need an umbrella, but stay alert for quick sky changes!`
            }
        }

        // Outfit / Clothing queries
        if (q.includes('wear') || q.includes('outfit') || q.includes('cloth') || q.includes('mặc')) {
            const temp = current?.temperature ?? 28
            if (temp >= 33) { 
                return `☀️ It is very hot (${temp}°C)! Wear light, breathable cotton clothing, sunglasses, a hat, and remember to stay hydrated.`
            } else if (temp >= 25) { 
                return `👕 The weather is pleasant and warm (${temp}°C). Standard casual short sleeves and lightweight clothes are ideal.` 
            } else if (temp >= 19) {
                return `🧥 Mild conditions (${temp}°C). A light jacket, hoodie, or long sleeves will keep you comfortable.`
            } else {
                return `🧣 Chilly weather (${temp}°C). Put on a warm coat or sweater before heading out.`
            }
        }

        // Workout / Exercise queries
        if (q.includes('workout') || q.includes('run') || q.includes('exercise') || q.includes('chạy') || q.includes('thể dục')) {
            const temp = current?.temperature ?? 28
            const aqiVal = aqi?.aqi ?? 50
            const isRaining = (current?.precipitation ?? 0) > 0

            if (isRaining) {
                return `🌧️ Outdoor workouts are not recommended right now due to ongoing rain. Consider doing an indoor session instead.`
            } else if (aqiVal > 100) {
                return `⚠️ Air quality is currently degraded (US AQI: ${aqiVal}). Sensitive groups should avoid intense outdoor cardio; an indoor gym workout is preferred.`
            } else if (temp > 34) { 
                return `🔥 High heat warning (${temp}°C). Postpone vigorous outdoor running until early morning or late evening to prevent heat exhaustion.`
            } else {
                return `🏃 Excellent conditions for outdoor exercise! The temperature is ${temp}°C with acceptable air quality (AQI: ${aqiVal}). Enjoy your run!`
            }
        }

        // Air Quality queries
        if (q.includes('air') || q.includes('aqi') || q,includes('pm2.5') || q.includes('không khí') || q.includes('pollution')) {
            if (!aqi) return `🍃 Air quality sensor data is currently synchronizing for ${location || 'your location'}.`
            return `🍃 Current US AQI is ${aqi.aqi}. Fine dust PM2.5 is ${aqi.pm2_5} µg/m³ and PM10 is ${aqi.pm10} µg/m³. Maintain normal ventilation if AQI is below 100.`
        }

        // Weekend / Weekly outlook
        if (q.includes('weekend') || q.includes('week') || q.includes('outlook') || q.includes('forecast') || q.includes('mai') || q.includes('tuần')) {
            if (daily && daily.length > 0) {
                const nextDay = daily[0]
                return `📅 Outlook: Tomorrow's expected average temperature is around ${Math.round(nextDay.avg_temp || nextDay.temperature || 28)}°C with ${nextDay.precipitation || 0}mm rainfall. The general trend for the week remains steady.`
            }

            return `📅 Over the next few days, expect steady seasonal temperatures around ${current?.temperature || 30}°C.`
        }

        // Default greeting / Summary
        return `🤖 At ${location || 'your station'}, current temperature is ${current?.temperature || '--'}°C with ${current?.humidity || '--'}% humidity and wind at ${current?.wind_speed || 0} km/h. Feel free to ask about rain risks, clothing, or exercise recommendations!`
    }

    // Handle user message submission
    const handleSend = async (queryText) => {
        const textToSend = queryText || input.trim()
        if (!textToSend || isTyping) return 

        const userMSG = { sender: 'user', text: textToSend }
        setMessage(prev => [...prev, userMSG])
        setInput('')
        setIsTyping(true)

        // Simulate natural response latency (400ms)
        setTimeout(async () => {
            const botReplyText = await generateBotResponse(textToSend)
            setMessage(prev => [...prev, { sender: 'bot', text: botReplyText }])
            setIsTyping(false)
        }, 400)
    }

    return (
        <>
            {/* Floating Action Button (FAB) */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-full p-3.5 shadow-2xl shadow-sky-500/30 border border-sky-400/40 flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
                    aria-label="Open AI Assistant"
                >
                    <span className="text-xl">🤖</span>
                    <span className="text-xs font-semibold pr-1 hidden sm:inline">Ask SkyBot</span>

                    {/* Pulsing online indicator badge */}
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                    </span>
                </button>
            )}

            {/* Chat Drawer / Modal */}
            {isOpen && (
                <div className="fixed bottom-16 right-2 sm:right-6 sm:bottom-20 z-50 w-[calc(100vw-16px)] sm:w-96 max-h-[580px] h-[75vh] flex flex-col bg-slate-900/95 backdrop-blur-2xl border border-slate-700/70 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-6">
                    {/* Header */}
                    <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/60 flex justify-between items-center">
                        <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-base shadow-inner">
                                🤖
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-white leading-tight">SkyBot AI</h3>
                                <p className="text-[10px] text-emerald-400 flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                                    Live Weather Connected
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700/50 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Live Context Banner */}
                    <div className="bg-slate-950/50 px-4 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>📍 {location || 'Current City'}</span>
                        <span>{current?.temperature ?? '--'}°C · {current?.precipitation > 0 ? '🌧️ Rain' : '🌤️ Dry'}</span>
                        {aqi && <span className="text-emerald-400">AQI: {aqi.aqi}</span>}
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 p-3.5 overflow-y-auto space-y-3 scrollbar-none text-xs">
                        {messages.map((m, idx) => (
                            <div 
                                key={idx}
                                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-md ${
                                        m.sender === 'user'
                                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-br-xs'
                                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                                    }`}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator bubble */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-bl-xs px-3.5 py-2 text-slate-400 flex items-center space-x-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delat:0.4s]"></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="px-3 py-1.5 border-t border-slate-800/60 flex items-center space-x-1.5 overflow-x-auto scrollbar-none bg-slate-950/40">
                        {suggestions.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(s.query)}
                                className="flex-shrink-0 text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-700/50 transition-colors"
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Input Bar */}
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSend()
                        }}
                        className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
                    >
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about rain, outfit, workout..."
                            className="flex-1 bg-slate-800/90 text-white placeholder-slate-500 text-xs rounded-xl px-3 py-2 border border-slate-700/60 focus:outline-none focus:border-sky-400"
                        />

                        <button 
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-all shadow-md flex items-center justify-center"
                        >
                             ➤
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}