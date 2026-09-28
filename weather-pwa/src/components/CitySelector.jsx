import { useState, useEffect, useRef } from 'react'

export default function CitySelector({
    selectedCity,
    customLocation,
    onSelectCity,
    onSelectCustomLocation,
    isGPSActive,
    onSelectGPS,
    loadingGPS
}) {
    const citites = [
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
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // Handle user selecting a search result
    const handleSelectResult = (item) => {
        onSelectCustomLocation({
            name: item.name, 
            country: item.country || '',
            admin1: item.admin1 || '',
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
                        className="w-full bg-slate-900/90 text-white placeholder-slate-400 text-xs rounded-2xl pl-10 pr-9 py-2.5 border border-slate-700/60 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 shadow-inner transition-all"
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('')
                                setResults([])
                                setIsOpen(false)
                            }}
                            className="absolute right-3 text-slate-400 hover:text-white text-xs p-1"  
                        >
                             ✕
                        </button>
                    )}
                </div>

                {/* Dropdown Results List */}
                {isOpen && query.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-1.5 animate-in fade-in slide-in-from-top-2">
                        {loadingSearch ? (
                            <p className="text-slate-400 text-xs py-3 px-3 text-center">Searching locations worldwide...</p>
                        ): results.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-none">
                                {results.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelectResult(item)}
                                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800/80 transition-colors flex items-center justify-between text-xs group">
                                        <div> 
                                            <p className="font-semibold text-white group-hover:text-sky-400 transition-colors">
                                                {item.name}
                                            </p>

                                            <p className="text-[10px] text-slate-400">
                                                {[item.admin1, item.country].filter(Boolean).join(', ')}
                                            </p>
                                        </div>

                                        <span className="text-[10px] text-slate-500 font-mono">
                                            {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                                        </span>    
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-xs py-3 px-3 text-center">
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
                            : "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white"
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
                                    : "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white"
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