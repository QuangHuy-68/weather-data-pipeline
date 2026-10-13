import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { API_BASE_URL } from '../config'

export default function ChatAssistant({ current, hourly = [], daily = [], aqi, location, onSelection }) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
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

    const handleFeedback = async (msgIndex, queryText, answerText, rating) => {
        try {
            const endpoint = window.location.hostname === 'localhost'
                ? 'http://localhost:8000/api/chat/feedback'
                : `${API_BASE_URL}/api/chat/feedback`
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: queryText || 'General conversation',
                    answer: answerText,
                    rating: rating
                })
            })
            // Đánh dấu tin nhắn đã được gửi phản hồi
            setMessages(prev => prev.map((m, idx) => 
                idx === msgIndex ? { ...m, feedbackGiven: rating } : m
            ))
        } catch (err) {
            console.warn('Feedback submission failed:', err)
        }
    }

    // Quick suggestion prompts with lifestyle & meteorological insights
    const suggestions = [
        { label: '☔ Need umbrella?', query: 'Do I need an umbrella today?' },
        { label: '👕 What to wear?', query: 'What should I wear today?' },
        { label: '🧺 Dry laundry?', query: 'Is it good weather to dry laundry outdoors today?' },
        { label: '🚗 Wash car?', query: 'Should I wash my car today or will it rain soon?' },
        { label: '☀️ UV & Sun risk?', query: 'How intense is the UV and sun exposure today?' },
        { label: '🏃 Workout?', query: 'Is the weather good for outdoor running or exercise?' },
        { label: '🍃 Air quality?', query: 'How is the air quality right now?' }
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
                name: place.name, 
                lat: place.latitude,
                lon: place.longitude,
                country: place.country,
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

        // Context-Aware Weather Reasoning Engine with Deep Meteorological Insights
    const generateBotResponse = async (userQuery) => {

        // =======================================================
        // SKYBOT KNOWLEDGE BASE & SEMANTIC ENGINE (FASTAPI)
        // =======================================================
        try { 
            const endpoint = window.location.hostname === 'localhost'
                ? 'http://localhost:8000/api/chat/ask'
                : `${API_BASE_URL}/api/chat/ask`

            const kbRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userQuery, 
                    current_city: location || 'HCM',
                    lang: 'vi',
                    user_id: localStorage.getItem('skybot_user_id') || 'user_huy' 
                })
            })

            if (kbRes.ok) { 
                const kbData = await kbRes.json()
                if (kbData && kbData.answer) {
                    return kbData.answer
                }
            }
        } catch (err) {
            console.warn('Knowledge Base API unreachable, falling back to local offline rules:', err)
        }

        const q = userQuery.toLowerCase()

        // 1. Detect if user is asking about a different city & fetch live data on-the-fly
        const targetCityName = extracttargetCity(userQuery)
        let otherCityData = null
        if (targetCityName) {
            otherCityData = await fetchCityWeather(targetCityName)
        }

        // 2. Compute Heat Index / Apparent Thermal Comfort
        const currentTemp = current?.temperature ?? 28
        const currentHumid = current?.humidity ?? 70
        // Australian/Rothfusz apparent temperature estimation
        const feelsLike = Math.round(currentTemp + (0.33 * (currentHumid / 100 * 6.105 * Math.exp(17.27 * currentTemp / (237.7 + currentTemp)))) - 4)

        // 3. Try Google Gemini with Deep Meteorological Context
        const activeKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY
        if (activeKey) {
            try {
                const next12Hours = hourly.slice(0, 12)
                const maxRainChance = Math.max(...next12Hours.map(h => h.rainProb || 0), 0)
                const upcomingOutlook = daily && daily.length > 0 
                    ? daily.slice(0, 3).map(d => `${d.day_name || 'Day'}: ${Math.round(d.avg_temp || 28)}°C, ${d.precipitation || 0}mm rain`).join('; ')
                    : 'Stable conditions'

                let weatherContext = `
Active Station Location: ${location || 'Selected Station'}
Current Temperature: ${currentTemp}°C (Feels like: ${feelsLike}°C due to ${currentHumid}% humidity)
Relative Humidity: ${currentHumid}%
Wind Speed: ${current?.wind_speed ?? 0} km/h
Precipitation right now: ${current?.precipitation ?? 0} mm
Peak Rain Probability in next 12 hours: ${maxRainChance}%
Air Quality Index: US-EPA AQI ${aqi?.aqi ?? 'N/A'} (PM2.5: ${aqi?.pm2_5 ?? 'N/A'} µg/m³)
Next days outlook: ${upcomingOutlook}
                `.trim()

                // Inject live data of requested target city if available
                if (otherCityData) {
                    weatherContext += `\n\n[LIVE ON-THE-FLY DATA FOR REQUESTED CITY: ${otherCityData.cityName}]:
Temperature: ${otherCityData.temp}°C
Humidity: ${otherCityData.humidity}%
Wind Speed: ${otherCityData.windSpeed} km/h
Precipitation right now: ${otherCityData.precipitation} mm
Peak rain chance in next 12 hours: ${otherCityData.maxRainProb}%`
                }

                const systemPrompt = `You are SkyBot, an expert meteorological AI assistant built for the SkyPulse weather app.
Expert Guidance:
1. Maintain conversational continuity across multi-turn questions.
2. Analyze meteorological metrics deeply:
   - Thermal Comfort: Compare real temperature with "Feels like" (${feelsLike}°C). Explain humidity effects.
   - Outdoor Drying (Phơi đồ): Favorable if rain chance < 25% and humidity < 75%; warn against outdoor drying if rain is imminent.
   - Car Wash (Rửa xe): Recommend washing if next 48h are dry; recommend postponing if rain probability is above 40%.
   - UV / Sun Exposure: Warn about peak solar intensity between 11:00 - 14:00.
3. If requested for another city, rely on [LIVE ON-THE-FLY DATA FOR REQUESTED CITY] to state exact numbers and recommend the top search bar for radar inspection.
4. If asked in Vietnamese, reply in natural, fluent Vietnamese. If in English, reply in English. Keep answers concise (2-4 sentences max) with lively weather emojis.`

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
        if (otherCityData) {
            return `📍 Weather in ${otherCityData.cityName}: Current temperature is ${otherCityData.temp}°C with ${otherCityData.humidity}% humidity and wind at ${otherCityData.windSpeed} km/h. Next 12h peak rain chance is ${otherCityData.maxRainProb}%. Search "${otherCityData.cityName}" in the top bar to inspect its full radar map!`
        }

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

        // Laundry drying queries
        if (q.includes('laundry') || q.includes('phơi') || q.includes('quần áo') || q.includes('dry')) {
            const next12Hours = hourly.slice(0, 12)
            const maxProb = Math.max(...next12Hours.map(h => h.rainProb || 0), 0)
            if (maxProb >= 40 || (current?.precipitation ?? 0) > 0) {
                return `🌧️ Not recommended to dry laundry outdoors today! Rain chance peaks at ${maxProb}%. It's safer to dry clothes indoors or use a dryer.`
            } else if ((current?.humidity ?? 70) > 82) {
                return `⛅ High humidity (${current?.humidity ?? 70}%). Clothes will take longer to dry outside. Hang them in a breezy, open space.`
            } else {
                return `🧺 Great day for laundry! Low rain chance (${maxProb}%) and good air circulation will dry your clothes quickly.`
            }
        }
        // Car wash queries
        if (q.includes('wash') || q.includes('car') || q.includes('rửa xe') || q.includes('xe')) {
            const next12Hours = hourly.slice(0, 12)
            const maxProb = Math.max(...next12Hours.map(h => h.rainProb || 0), 0)
            if (maxProb >= 35 || (current?.precipitation ?? 0) > 0) {
                return `🚗 Postpone car washing! Rain is probable within 12-24 hours (${maxProb}% chance). Save your time and wash it after the weather stabilizes.`
            } else {
                return `✨ Excellent weather to wash your car! Dry conditions and low precipitation chance (${maxProb}%) will keep your vehicle clean.`
            }
        }
        // UV and Sun exposure queries
        if (q.includes('uv') || q.includes('sun') || q.includes('nắng') || q.includes('cực tím')) {
            const temp = current?.temperature ?? 28
            if (temp >= 32) {
                return `☀️ High solar intensity today! UV levels are dangerous between 11:00 AM and 2:00 PM. Apply SPF 50+ sunscreen, wear UV-blocking sunglasses, and stay in shade.`
            } else {
                return `🌤️ Moderate sun exposure today. Standard sun protection is sufficient, but keep sunglasses handy if going outdoors at midday.`
            }
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
            const targetCityName = extracttargetCity(textToSend)
            const cityData = targetCityName ? await fetchCityWeather(targetCityName) : null

            setMessages(prev => [...prev, { sender: 'bot', text: botReplyText, actionLocation: cityData }])
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
                    className={`fixed bottom-20 right-4 z-40 rounded-full px-3.5 py-1.5 backdrop-blur-xl flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95 border ${
                        isDark
                            ? 'bg-slate-800/95 hover:bg-slate-700 text-white border-slate-600/80 shadow-lg shadow-black/80'
                            : 'bg-white/95 hover:bg-slate-50 text-slate-800 border-slate-200/90 shadow-lg shadow-slate-300/60'
                    }`}
                    aria-label="Open AI Assistant"
                >
                    <span className="text-xs font-semibold tracking-wide">Ask SkyBot</span>

                    {/* Online status indicator */}

                    <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-ful rounded-full opacity-75 ${apiKey ? 'bg-sky-400' : 'bg-emerald-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${apiKey ? 'bg-sky-400' : 'bg-emerald-400'}`}></span>
                    </span>
                </button>
            )}

            {/* Chat Drawer / Modal */}
            {isOpen && (
                <div className={`fixed bottom-16 right-2 sm:right-6 sm:bottom-20 z-50 w-[calc(100vw-16px)] sm:w-96 max-h-[580px] h-[75vh] flex flex-col backdrop-blur-2xl rounded-3xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-6 border ${
                    isDark
                        ? 'bg-slate-900/95 border-slate-700/70 shadow-2xl shadow-black/80 text-white'
                        : 'bg-white/95 border-slate-200/90 shadow-2xl shadow-slate-300/70 text-slate-900'
                }`}>

                    {/* Header */}
                    <div className={`px-4 py-3 border-b flex justify-between items-center transition-colors ${
                        isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-100/80 border-slate-200/80'
                    }`}>

                        <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-base shadow-inner">
                                🤖
                            </div>

                            <div>
                                <h3 className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    SkyBot AI
                                </h3>

                                <p className="text-[10px] flex items-center">
                                    {apiKey ? (
                                        <span className="text-sky-500 flex items-center font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1 animate-pulse"></span>
                                            {displayModelName} Active
                                        </span>
                                    ) : (

                                        <span className="text-emerald-500 flex items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 me-1"></span>
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
                                className={`p-1.5 rounded-full transition-colors text-xs ${
                                    isDark
                                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                                }`}
                            >
                                ⚙️
                            </button>

                            {/* Clear conversation button */}
                            <button
                                onClick={handleClearChat}
                                title="Clear conversation"
                                className={`p-1.5 rounded-full transition-colors text-xs ${
                                    isDark 
                                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                                }`}
                            >
                                🗑️
                            </button>

                            {/* Close drawer button */}
                            <button 
                                onClick={() => setIsOpen(false)}
                                title="Close"
                                className={`p-1.5 rounded-full transition-colors text-xs ${
                                    isDark 
                                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                                }`}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                     {/* Settings Panel Overlay */}
                     {showSettings && (
                        <div className={`border-b p-3.5 text-xs animate-in fade-in duration-200 transition-colors ${
                            isDark  
                                ? 'bg-slate-800/95 border-slate-700/80 text-slate-300' 
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`font-semibold flex items-center space-x-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    <span>🔑</span>
                                    <span>Google Gemini API Key</span>
                                </span>

                                <button
                                    onClick={() => setShowSettings(false)}
                                    className={`text-xs ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
                                    >
                                        ✕
                                </button>
                            </div>
                            
                            <p className={`text-[11px] mb-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Get your free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-sky-500 underline font-medium">aistudio.google.com</a>. Saved securely in your browser's LocalStorage.
                            </p>

                            <form onSubmit={handleSaveKey} className="space-y-2">
                                <input
                                    type="text"
                                    value={keyInput}
                                    onChange={(e) => setKeyInput(e.target.value)}
                                    placeholder="Paste Gemini Key (AIzaSy... or AQ...)"
                                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-mono transition-all border ${
                                        isDark
                                            ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-sky-400' 
                                            : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500 shadow-sm'
                                    }`}
                                />

                                {keyStatusMessage && (
                                    <p className={`text-[11px] font-medium ${keyStatusMessage.startsWith('✅') ? 'text-emerald-500' : keyStatusMessage.startsWith('❌') ? 'text-red-500' : 'text-sky-500'}`}>
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
                                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 rounded-lg transition-colors font-medium"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Live Context Banner */}
                    <div className={`px-4 py-1.5 border-b flex items-center justify-between text-[11px] transition-colors ${
                        isDark 
                            ? 'bg-slate-950/50 border-slate-800/80 text-slate-400' 
                            : 'bg-sky-50/80 border-sky-100 text-slate-600'
                    }`}>
                        <span>📍 {location || 'Current City'}</span>
                        <span>{current?.temperature ?? '--'}°C · {current?.precipitation > 0 ? '🌧️ Rain' : '🌤️ Dry'}</span>
                        {aqi && <span className="text-emerald-500 font-medium">AQI: {aqi.aqi}</span>}
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 p-3.5 overflow-y-auto space-y-3 scrollbar-none text-xs">
                        {messages.map((m, idx) => (
                            <div 
                                key={idx}
                                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-md whitespace-pre-line transition-all ${
                                        m.sender === 'user'
                                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-br-xs'
                                            : isDark

                                                ? 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                                                : 'bg-slate-100 text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-sm'
                                    }`}
                                >
                                    {m.text}

                                    {/* Action Card: Switch App Location */}
                                    {m.actionLocation && onSelection && (
                                        <div className={`mt-2.5 pt-2 border-t flex items-center justify-between ${
                                            isDark ? 'border-slate-700/60' : 'border-slate-200'
                                        }`}>
                                            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500' }`}>
                                                View radar & charts:
                                            </span>

                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    onSelection({
                                                        name: m.actionLocation.name,
                                                        lat: m.actionLocation.lat,
                                                        lon: m.actionLocation.lon,
                                                        country: m.actionLocation.country
                                                    })

                                                    setIsOpen(false)
                                                }}
                                                className={`inline-flex items-center space-x-1 border px-2 py-1 rounded-lg text-[10px] font-semibold transition-all transform hover:scale-105 active:scale-95 ${
                                                    isDark
                                                        ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white border-sky-400/40'
                                                        : 'bg-sky-50 hover:bg-sky-100 text-sky-600 border-sky-200'
                                                }`}
                                            >
                                                <span>📍 Switch to {m.actionLocation.name}</span>
                                                <span>➔</span>
                                            </button>
                                        </div>
                                    )}


                                    {m.sender === 'bot' && (
                                        <div className={`mt-2 pt-1.5 border-t flex items-center gap-2 ${
                                            isDark ? 'border-slate-700/50' : 'border-slate-200/80'
                                        }`}>
                                            <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                Đánh giá:
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleFeedback(idx, messages[idx - 1]?.text, m.text, 1)}
                                                disabled={m.feedbackGiven !== undefined}
                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition-all ${
                                                    m.feedbackGiven === 1
                                                        ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                                                        : isDark
                                                            ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                                                            : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                                                }`}
                                                title="Câu trả lời hữu ích"
                                            >
                                                👍 {m.feedbackGiven === 1 ? 'Đã thích' : ''}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleFeedback(idx, messages[idx - 1]?.text, m.text, -1)}
                                                disabled={m.feedbackGiven !== undefined}
                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] transition-all ${
                                                    m.feedbackGiven === -1
                                                        ? 'bg-rose-500/20 text-rose-400 font-medium'
                                                        : isDark
                                                            ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                                                            : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                                                }`}
                                                title="Cần cải thiện"
                                            >
                                                👎 {m.feedbackGiven === -1 ? 'Đã ghi nhận' : ''}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator bubble */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className={`order rounded-2xl rounded-bl-xs px-3.5 py-2 flex items-center space-x-1 ${
                                    isDark
                                        ? 'bg-slate-800/90 border-slate-700/60 text-slate-400'
                                        : 'bg-slate-100 border-slate-200 text-slate-500 shadow-sm'
                                }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className={`px-3 py-1.5 border-t flex items-center space-x-1.5 overflow-x-auto scrollbar-none transition-colors ${
                        isDark
                            ? 'border-slate-800/60 bg-slate-950/40'
                            : 'border-slate-100 bg-slate-50/80'
                    }`}>
                        {suggestions.map((s, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(s.query)}
                                className={`flex-shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                                    isDark
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/50' 
                                        : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200/90 shadow-xs'
                                }`}
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
                        className={`p-2.5 border-t flex items-center space-x-2 transition-colors ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                    >
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask follow-up questions naturally..."
                            className={`flex-1 text-xs rounded-xl px-3 py-2 border focus:outline-none transition-all ${
                                isDark 
                                    ? 'bg-slate-800/90 text-white placeholder-slate-500 border-slate-700/60 focus:border-sky-400' 
                                    : 'bg-slate-100 text-slate-800 placeholder-slate-400 border-slate-200 focus:border-sky-500 focus:bg-white'
                            }`}
                        />

                        <button 
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white rounded-xl px-3 py-2 text-xs font-semibold transition-all shadow-md flex items-center justify-center cursor-pointer"
                        >
                             ➤
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}