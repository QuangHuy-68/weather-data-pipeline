import { useState, useRef, useEffect } from 'react'

export default function ChatAssistant({ current, hourly = [], daily = [], aqi, location }) {
    const [isOpen, setIsOpen] = useState(false)
    const [showSettings, setShowSettings] = useState(false)
    
    // API Key & Model persisted in LocalStorage
    const [apiKey, setApiKey] = useState(() => {
        return localStorage.getItem('skybot_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || ''
    })
    const [modelName, setModelName] = useState(() => {
        return localStorage.getItem('skybot_gemini_model') || 'models/gemini-2.0-flash'
    })
    const [keyInput, setKeyInput] = useState('')
    const [keyStatusMessage, setKeyStatusMessage] = useState('')
    const [isValidatingKey, setIsValidatingKey] = useState(false)

    const [messages, setMessages] = useState([
        {
            sender: 'bot', 
            text: `Hi! I am SkyBot, your AI weather assistant. Ask me anything about rain probability, outfit suggestions, outdoor activities, or air quality for ${location || 'your city'}!`
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)

    // Auto-scroll to latest message
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isOpen, isTyping])

    // Test and save API Key with Auto-Model Discovery
    const handleSaveKey = async (e) => {
        e.preventDefault()
        const trimmed = keyInput.trim().replace(/^["']|["']$/g, '')
        
        if (!trimmed) {
            localStorage.removeItem('skybot_gemini_api_key')
            localStorage.removeItem('skybot_gemini_model')
            setApiKey('')
            setModelName('')
            setKeyStatusMessage('API Key removed. SkyBot switched to Local Engine.')
            setTimeout(() => {
                setKeyStatusMessage('')
                setShowSettings(false)
            }, 1200)
            return
        }

        setIsValidatingKey(true)
        setKeyStatusMessage('Connecting & detecting available Gemini models...')

        try {
            // 1. Discover all active models supported by user's key
            const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`)
            const modelsData = await modelsRes.json()

            if (!modelsRes.ok) {
                const errMsg = modelsData?.error?.message || `HTTP ${modelsRes.status}`
                setKeyStatusMessage(`❌ Error: ${errMsg}`)
                setIsValidatingKey(false)
                return
            }

            const availableModels = (modelsData.models || []).filter(m => 
                m.supportedGenerationMethods?.includes('generateContent')
            )

            if (availableModels.length === 0) {
                setKeyStatusMessage('❌ Error: No models with generateContent capability found for this key.')
                setIsValidatingKey(false)
                return
            }

            // Pick the best available modern Flash model
            const chosen = 
                availableModels.find(m => m.name.includes('2.5-flash')) ||
                availableModels.find(m => m.name.includes('2.0-flash')) ||
                availableModels.find(m => m.name.includes('flash')) ||
                availableModels.find(m => m.name.includes('gemini')) ||
                availableModels[0]

            const selectedModel = chosen.name

            // 2. Perform test ping with discovered model
            const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${trimmed}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hello' }] }]
                })
            })

            const testData = await testRes.json()

            if (!testRes.ok) {
                const errMsg = testData?.error?.message || `HTTP ${testRes.status}`
                setKeyStatusMessage(`❌ Error: ${errMsg}`)
                setIsValidatingKey(false)
                return
            }

            // Save key and discovered model
            localStorage.setItem('skybot_gemini_api_key', trimmed)
            localStorage.setItem('skybot_gemini_model', selectedModel)
            setApiKey(trimmed)
            setModelName(selectedModel)

            const cleanDisplayName = selectedModel.replace('models/', '').replace(/^gemini-/, 'Gemini ')
            setKeyStatusMessage(`✅ Verified! Connected to ${cleanDisplayName}`)
            setTimeout(() => {
                setKeyStatusMessage('')
                setShowSettings(false)
            }, 1400)
        } catch (err) {
            setKeyStatusMessage(`❌ Network error: ${err.message}`)
        } finally {
            setIsValidatingKey(false)
        }
    }

    const handleClearChat = () => {
        setMessages([
            {
                sender: 'bot',
                text: `Chat cleared! How can I assist your day in ${location || 'your city'}?`
            }
        ])
    }

    // Quick suggestion prompts
    const suggestions = [
        { label: '☔ Need umbrella?', query: 'Do I need an umbrella today?' },
        { label: '👕 What to wear?', query: 'What should I wear today?' },
        { label: '🏃 Workout?', query: 'Is the weather good for outdoor exercise?' },
        { label: '🍃 Air quality?', query: 'How is the air quality right now?' },
        { label: '📅 Weekend outlook', query: 'What is the upcoming forecast outlook?' }
    ]

    // Helper: Extract target city from natural language query
    const extracttargetCity = (query) => {
        const text = query.trim()
        const patterns = [
            /(?:thời tiết|thoi tiet|mưa|mua|nhiệt độ|nhiet do)\s+(?:ở|o|tại|tai)\s+([A-Za-zÀ-ỹ\s]+?)(?:\?|\.|,|thế nào|the nao|sao|không|khong|$)/i,
            /(?:weather in|forecast for|how about|and)\s+([A-Za-zÀ-ỹ\s]+?)(?:\?|\.|,|weather|forecast|$)/i,
            /(?:ở|o|tại|tai)\s+([A-Za-zÀ-ỹ\s]+?)\s+(?:thời tiết|thoi tiet|thế nào|the nao|có mưa|co mua)/i
        ]

        for (const pattern of patterns) {
            const match = text.match(pattern)
            if (match && match[1]) {
                const cleaned = match[1].trim().replace(/\s+(weather|thời tiết)$/i, '')

                if (cleaned.length >= 2 && cleaned.toLowerCase() !== location?.toLowerCase()) {
                    return cleaned
                }
            }
        }
        return null
    }

    // Helper: Fetch live weather data for any requested city on-the-fly
    const fetchCityWeather = async (cityName) => {
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`)
            const geoData = await geoRes.json()
            if (!geoData.results || geoData.results.length === 0) return null
            const place = geoData.results[0]
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=precipitation_probability&timezone=auto`)
            const weatherData = await weatherRes.json()
            const currentHour = new Date().getHours()
            const next12HoursProb = (weatherData.hourly?.precipitation_probability || [])
                .slice(currentHour, currentHour + 12)
            const maxRainProb = next12HoursProb.length > 0 ? Math.max(...next12HoursProb) : 0

            return {
                cityName: `${place.name}${place.country ? ', ' + place.country : ''}`,
                temp: weatherData.current?.temperature_2m,
                humidity: weatherData.current?.relative_humidity_2m,
                windSpeed: weatherData.current?.wind_speed_10m,
                precipitation: weatherData.current?.precipitation || 0, maxRainProb
            }
        } catch (err) {
            console.warn('On-the-fly city fetch failed:', err)
            return null
        }
    }

    // Context-Aware Weather Reasoning Engine with Multi-turn Memory
    const generateBotResponse = async (userQuery) => {
        const q = userQuery.toLowerCase()

        // 1. Try Google Gemini with Conversation History
        const activeKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY
        if (activeKey) {
            try {
                const next12Hours = hourly.slice(0, 12)
                const maxRainChance = Math.max(...next12Hours.map(h => h.rainProb || 0), 0)
                const upcomingOutlook = daily && daily.length > 0 
                    ? daily.slice(0, 3).map(d => `${d.day_name || 'Day'}: ${Math.round(d.avg_temp || 28)}°C, ${d.precipitation || 0}mm rain`).join('; ')
                    : 'Stable conditions'

                const weatherContext = `
Active Station Location: ${location || 'Selected Station'}
Current Temperature: ${current?.temperature ?? '--'}°C
Relative Humidity: ${current?.humidity ?? '--'}%
Wind Speed: ${current?.wind_speed ?? 0} km/h
Precipitation right now: ${current?.precipitation ?? 0} mm
Peak Rain Probability in next 12 hours: ${maxRainChance}%
Air Quality Index: US-EPA AQI ${aqi?.aqi ?? 'N/A'} (PM2.5: ${aqi?.pm2_5 ?? 'N/A'} µg/m³)
Next days outlook: ${upcomingOutlook}
                `.trim()

                const systemPrompt = `You are SkyBot, an ultra-smart, friendly meteorological AI assistant built for the SkyPulse weather app.
Guidelines:
1. Maintain conversational continuity by remembering previous questions and answers in this chat.
2. The currently active app station data is for "${location || 'Current City'}".
3. If the user asks about the weather in ANOTHER city (e.g. Thai Binh, Hanoi, Da Nang, Tokyo, Paris):
   - Answer their question using your general meteorological knowledge about that location.
   - Gently remind them they can search and select that city in the app's top search bar to view its live Doppler radar, AQI, and hourly forecast.
4. If the user asks in Vietnamese, reply in fluent, friendly Vietnamese. If asked in English, reply in English.
5. Keep answers concise (2-4 sentences max), engaging, and helpful with appropriate weather emojis (☀️, 🌧️, 🧥, 🏃, 💨, 🍃).`

                // Build clean multi-turn conversation history for Gemini API
                // Filter out error alerts and take the last 6 turns to keep context fast and relevant
                const validHistory = messages.filter(m => m.text && !m.text.startsWith('⚠️'))
                const firstUserIndex = validHistory.findIndex(m => m.sender === 'user')
                const historySlice = firstUserIndex !== -1 ? validHistory.slice(firstUserIndex).slice(-6) : []

                const contentsPayload = []
                historySlice.forEach(m => {
                    const role = m.sender === 'user' ? 'user' : 'model'
                    // Gemini requires strictly alternating roles (user -> model -> user -> model)
                    if (contentsPayload.length > 0 && contentsPayload[contentsPayload.length - 1].role === role) {
                        contentsPayload[contentsPayload.length - 1].parts[0].text += `\n${m.text}`
                    } else {
                        contentsPayload.push({ role, parts: [{ text: m.text }] })
                    }
                })

                // Append the current turn with fresh real-time weather context
                const currentPrompt = `[REAL-TIME APP CONTEXT]:\n${weatherContext}\n\n[USER QUESTION]:\n"${userQuery}"`
                if (contentsPayload.length > 0 && contentsPayload[contentsPayload.length - 1].role === 'user') {
                    contentsPayload.push({ role: 'model', parts: [{ text: 'Continuing weather discussion.' }] })
                }
                contentsPayload.push({ role: 'user', parts: [{ text: currentPrompt }] })

                const targetModel = modelName || 'models/gemini-2.0-flash'
                const endpoint = targetModel.startsWith('models/') ? targetModel : `models/${targetModel}`

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${endpoint}:generateContent?key=${activeKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: systemPrompt }]
                        },
                        contents: contentsPayload,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 350
                        }
                    })
                })

                const result = await res.json()

                if (!res.ok) {
                    const errorDetail = result?.error?.message || `HTTP ${res.status}`
                    return `⚠️ Gemini API Error: ${errorDetail}. Click ⚙️ to update your API key, or remove it to use the offline engine.`
                }

                const reply = result?.candidates?.[0]?.content?.parts?.[0]?.text
                if (reply && reply.trim()) {
                    return reply.trim()
                }
            } catch (err) {
                console.warn('Gemini API call failed, falling back to Local Engine:', err)
                return `⚠️ Connection Error: Unable to reach Gemini API (${err.message}). Falling back to local offline engine.`
            }
        }

        // 2. Built-in Local Fallback Engine (Zero latency, works offline)
        if (q.includes('umbrella') || q.includes('rain') || q.includes('mưa') || q.includes('dù') || q.includes('ô')) {
            const next12Hours = hourly.slice(0, 12)
            const rainySlot = next12Hours.find(h => h.rainProb >= 30)
            const maxProb = Math.max(...next12Hours.map(h => h.rainProb || 0), 0)

            if (current?.precipitation > 0) {
                return `🌧️ It is currently raining (${current.precipitation} mm) in ${location || 'your area'}. You will definitely need an umbrella or raincoat!`
            } else if (rainySlot) {
                return `☔ Rain is probable today! Rain chance peaks at around ${maxProb}% at ${rainySlot.displayTime}. It is strongly recommended to carry an umbrella.`
            } else {
                return `☀️ Low chance of rain today (peak probability is only ${maxProb}%). You likely won't need an umbrella, but stay alert for quick sky changes!`
            }
        }

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

        if (q.includes('workout') || q.includes('run') || q.includes('exercise') || q.includes('chạy') || q.includes('thể dục')) {
            const temp = current?.temperature ?? 28
            const aqiVal = aqi?.aqi ?? 50
            const isRaining = (current?.precipitation ?? 0) > 0

            if (isRaining) {
                return `🌧️ Outdoor workouts are not recommended right now due to ongoing rain. Consider doing an indoor session instead.`
            } else if (aqiVal > 100) {
                return `⚠️ Air quality is degraded (US AQI: ${aqiVal}). Sensitive groups should avoid intense outdoor cardio; an indoor workout is preferred.`
            } else if (temp > 34) { 
                return `🔥 High heat warning (${temp}°C). Postpone vigorous outdoor running until early morning or late evening to prevent heat exhaustion.`
            } else {
                return `🏃 Excellent conditions for outdoor exercise! The temperature is ${temp}°C with acceptable air quality (AQI: ${aqiVal}). Enjoy your run!`
            }
        }

        if (q.includes('air') || q.includes('aqi') || q.includes('pm2.5') || q.includes('không khí') || q.includes('pollution')) {
            if (!aqi) return `🍃 Air quality sensor data is currently synchronizing for ${location || 'your location'}.`
            return `🍃 Current US AQI is ${aqi.aqi}. Fine dust PM2.5 is ${aqi.pm2_5} µg/m³ and PM10 is ${aqi.pm10} µg/m³. Maintain normal ventilation if AQI is below 100.`
        }

        if (q.includes('weekend') || q.includes('week') || q.includes('outlook') || q.includes('forecast') || q.includes('mai') || q.includes('tuần')) {
            if (daily && daily.length > 0) {
                const nextDay = daily[0]
                return `📅 Outlook: Tomorrow's expected average temperature is around ${Math.round(nextDay.avg_temp || nextDay.temperature || 28)}°C with ${nextDay.precipitation || 0}mm rainfall. The general trend for the week remains steady.`
            }
            return `📅 Over the next few days, expect steady seasonal temperatures around ${current?.temperature || 30}°C.`
        }

        return `🤖 In ${location || 'your station'}, current temperature is ${current?.temperature || '--'}°C with ${current?.humidity || '--'}% humidity and wind at ${current?.wind_speed || 0} km/h. To check another city, type its name in the top search bar!`
    }

    // Handle user message submission
    const handleSend = async (queryText) => {
        const textToSend = queryText || input.trim()
        if (!textToSend || isTyping) return 

        const userMSG = { sender: 'user', text: textToSend }
        setMessages(prev => [...prev, userMSG])
        setInput('')
        setIsTyping(true)

        try {
            const botReplyText = await generateBotResponse(textToSend)
            setMessages(prev => [...prev, { sender: 'bot', text: botReplyText }])
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'bot', text: '⚠️ Unable to process query. Please check connection or try again.' }])
        } finally {
            setIsTyping(false)
        }
    }

    const displayModelName = modelName 
        ? modelName.replace('models/', '').replace(/^gemini-/, 'Gemini ')
        : 'Gemini 2.0 Flash'

    return (
        <>
            {/* Floating Action Button (FAB) */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-20 right-4 z-40 bg-slate-800/95 hover:bg-slate-700 text-white rounded-full px-3.5 py-1.5 shadow-lg shadow-black/80 border border-slate-600/80 hover:border-slate-500 backdrop-blur-xl flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
                    aria-label="Open AI Assistant"
                >
                    <span className="text-xs font-medium tracking-wide">Ask SkyBot</span>
                    {/* Online status indicator */}
                    <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiKey ? 'bg-sky-400' : 'bg-emerald-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${apiKey ? 'bg-sky-400' : 'bg-emerald-400'}`}></span>
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
                                <p className="text-[10px] flex items-center">
                                    {apiKey ? (
                                        <span className="text-sky-400 flex items-center font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-1 animate-pulse"></span>
                                            {displayModelName} Active
                                        </span>
                                    ) : (
                                        <span className="text-emerald-400 flex items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1"></span>
                                            Local Engine Active
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center space-x-1">
                            {/* Settings button */}
                            <button
                                onClick={() => {
                                    setKeyInput(apiKey)
                                    setShowSettings(!showSettings)
                                }}
                                title="AI Engine Settings"
                                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-700/50 transition-colors text-xs"
                            >
                                ⚙️
                            </button>

                            {/* Clear conversation button */}
                            <button
                                onClick={handleClearChat}
                                title="Clear conversation"
                                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-700/50 transition-colors text-xs"
                            >
                                🗑️
                            </button>

                            {/* Close drawer button */}
                            <button 
                                onClick={() => setIsOpen(false)}
                                title="Close"
                                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-700/50 transition-colors text-xs"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Settings Panel Overlay */}
                    {showSettings && (
                        <div className="bg-slate-800/95 border-b border-slate-700/80 p-3.5 text-xs text-slate-300 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-white flex items-center space-x-1.5">
                                    <span>🔑</span>
                                    <span>Google Gemini API Key</span>
                                </span>
                                <button 
                                    onClick={() => setShowSettings(false)}
                                    className="text-slate-400 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                                Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-sky-400 underline">aistudio.google.com</a>. Saved securely in your browser's LocalStorage.
                            </p>
                            <form onSubmit={handleSaveKey} className="space-y-2">
                                <input
                                    type="text"
                                    value={keyInput}
                                    onChange={(e) => setKeyInput(e.target.value)}
                                    placeholder="Paste Gemini Key (AIzaSy... or AQ...)"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400 font-mono"
                                />
                                {keyStatusMessage && (
                                    <p className={`text-[11px] font-medium ${keyStatusMessage.startsWith('✅') ? 'text-emerald-400' : keyStatusMessage.startsWith('❌') ? 'text-red-400' : 'text-sky-400'}`}>
                                        {keyStatusMessage}
                                    </p>
                                )}
                                <div className="flex space-x-2 pt-1">
                                    <button
                                        type="submit"
                                        disabled={isValidatingKey}
                                        className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-1 rounded-lg font-medium transition-colors"
                                    >
                                        {isValidatingKey ? 'Detecting Model...' : 'Test & Save Key'}
                                    </button>
                                    {apiKey && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setKeyInput('')
                                                localStorage.removeItem('skybot_gemini_api_key')
                                                localStorage.removeItem('skybot_gemini_model')
                                                setApiKey('')
                                                setModelName('')
                                                setKeyStatusMessage('API Key removed!')
                                                setTimeout(() => setShowSettings(false), 1000)
                                            }}
                                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg transition-colors"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

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
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-md whitespace-pre-line ${
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
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
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
                            placeholder="Ask follow-up questions naturally..."
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