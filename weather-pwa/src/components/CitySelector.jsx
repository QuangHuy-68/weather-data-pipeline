export default function CitySelector({
    selectedCity,
    onSelectCity,
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

    return (
        <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onSelectGPS}
                    disabled={loadingGPS}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${isGPSActive
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30 scale-105"
                        : "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white"
                    }`}
                >
                    <span className={loadingGPS ? "animate-spin" : ""}>
                        {loadingGPS ? "⏳" : "📍"}
                    </span>

                    <span>{loadingGPS ? "Locating..." : "My location"}</span>
                </button>

                {citites.map((city) => {
                    const isActive = !isGPSActive && selectedCity === city.id

                    return (
                        <button
                            key={city.id}
                            type="button"
                            onClick={() => onSelectCity(city.id)}
                            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${isActive
                                ? "bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/30 scale-105"
                                : "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white"
                            }`}
                        >
                            {city.name}   
                        </button>
                    )
                })}
            </div>
        </div>
    )
}