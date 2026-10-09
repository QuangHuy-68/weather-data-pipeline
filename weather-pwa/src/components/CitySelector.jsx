import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function CitySelector({
    selectedCity,
    customLocation,
    onSelectCity,
    onSelectCustomLocation,
    isGPSActive,
    onSelectGPS,
    loadingGPS
}) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    const presetCities = [
        { id: "HCM", name: "TP.Hồ Chí Minh" },
        { id: "HN", name: "Hà Nội" }, 
        { id: "DN", name: "Đà Nẵng" },
        { id: "CT", name: "Cần Thơ" },
        { id: "HP", name: "Hải Phòng" },
    ]

    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loadingSearch, setLoadingSearch] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const searchContainerRef = useRef(null)

    // Close search dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Debounced Search using Open-Meteo Geocoding API
    useEffect(() => {
        const q = query.trim()
        if (q.length < 2) {
            setResults([])
            setLoadingSearch(false)
            return
        }

        setLoadingSearch(true)
        const timer = setTimeout(() => {
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`)
                .then(res => res.json())
                .then(data => {
                    setResults(data.results || [])
                    setLoadingSearch(false)
                    setIsOpen(true)
                })
                .catch(() => {
                    setResults([])
                    setLoadingSearch(false)
                })
        }, 350)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelectResult = (item) => {
        onSelectCustomLocation({
            name: item.name,
            country: item.country,
            lat: item.latitude,
            lon: item.longitude
        })
        setQuery('')
        setResults([])
        setIsOpen(false)
    }

    return (
       <div className="mb-6 space-y-3">
            {/* Global Autocomplete Search Bar */}
            <div ref={searchContainerRef} className="relative w-full">
                <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 select-none text-sm">
                        {loadingSearch ? '⏳' : '🔍'}
                    </span>
                    <input 
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => {
                            if (results.length > 0) setIsOpen(true)
                        }}
                        placeholder="Search any location (e.g. Da Lat, Tokyo, Paris)..."
                        className={`w-full text-xs rounded-2xl pl-10 pr-9 py-2.5 border focus:outline-none focus:ring-1 transition-all ${
                            isDark
                                ? 'bg-slate-900/90 text-white placeholder-slate-400 border-slate-700/60 focus:border-sky-400 focus:ring-sky-400/30 shadow-inner'
                                : 'bg-white text-slate-800 placeholder-slate-400 border-slate-200/90 focus:border-sky-500 focus:ring-sky-500/20 shadow-sm'
                        }`}
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('')
                                setResults([])
                                setIsOpen(false)
                            }}
                            className={`absolute right-3 text-xs p-1 transition-colors ${
                                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                            }`}  
                        >
                             ✕
                        </button>
                    )}
                </div>

                {/* Dropdown Results List */}
                {isOpen && query.trim().length >= 2 && (
                    <div className={`absolute top-full left-0 right-0 mt-1.5 z-50 backdrop-blur-2xl border rounded-2xl overflow-hidden p-1.5 animate-in fade-in slide-in-from-top-2 shadow-2xl ${
                        isDark 
                            ? 'bg-slate-900/95 border-slate-700/80 shadow-black/80' 
                            : 'bg-white/95 border-slate-200 shadow-slate-300/60'
                    }`}>
                        {loadingSearch ? (
                            <p className={`text-xs py-3 px-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Searching locations worldwide...
                            </p>
                        ) : results.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-none">
                                {results.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectResult(item)}
                                        className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between text-xs group ${
                                            isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-100'
                                        }`}
                                    >
                                        <div> 
                                            <p className={`font-semibold transition-colors ${
                                                isDark ? 'text-white group-hover:text-sky-400' : 'text-slate-800 group-hover:text-sky-600'
                                            }`}>
                                                {item.name}
                                            </p>

                                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {[item.admin1, item.country].filter(Boolean).join(', ')}
                                            </p>
                                        </div>

                                        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                                        </span>    
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className={`text-xs py-3 px-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                No locations found for "{query}".
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Preset Buttons & Active Custom Location Pill */}
            <div className="flex flex-wrap items-center gap-2">
                {/* GPS Location Button */}
                <button
                    type="button"
                    onClick={onSelectGPS}
                    disabled={loadingGPS}
                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                        isGPSActive
                            ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30 scale-105"
                            : isDark
                                ? "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                    }`}
                >
                    <span className={loadingGPS ? "animate-spin" : ""}>
                        {loadingGPS ? "⏳" : "📍"}
                    </span>

                    <span>{loadingGPS ? "Locating..." : "My location"}</span>
                </button>

                {/* Preset VN Cities */}
                {presetCities.map((city) => {
                    const isActive = !isGPSActive && !customLocation && selectedCity === city.id
                    return (
                        <button 
                            key={city.id} 
                            type="button"
                            onClick={() => onSelectCity(city.id)}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                                isActive
                                    ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30 scale-105"
                                    : isDark
                                        ? "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                            }`}
                        >
                            {city.name}   
                        </button>
                    )
                })}

                {/* Custom Searched Location Pill (if active) */}
                {customLocation && !isGPSActive && (
                    <div className="flex items-center bg-sky-500 text-white border border-sky-400 shadow-md shadow-sky-500/30 px-3 py-1.5 rounded-full text-xs font-medium scale-105 space-x-1.5">
                        <span>✨ {customLocation.name}</span>
                    </div>
                )}
            </div>
       </div>
    )
}