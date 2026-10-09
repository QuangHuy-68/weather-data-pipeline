import { useEffect, useRef, useState } from "react"
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../context/ThemeContext'

export default function WeatherRadar({ lat = 10.8231, lon = 106.6297, locationName = 'Location' }) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    const mapRef = useRef(null)
    const mapInstance = useRef(null)
    const radarLayerRef = useRef(null)
    const markerRef = useRef(null)
    const baseTileLayerRef = useRef(null)

    const [frames, setFrames] = useState([])
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [host, setHost] = useState('https://tilecache.rainviewer.com')
    const [loading, setLoading] = useState(true)

    // Base map tile URLs for Dark and Light modes
    const darkTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    const lightTileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

    // 1. Initialize Leaflet Map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return

        // Create Leaflet map centered at selected coordinates
        const map = L.map(mapRef.current, { 
            center: [lat, lon],
            zoom: 7,
            zoomControl: false,
            attributionControl: false
        })

        // Adaptive Base Map Layer
        baseTileLayerRef.current = L.tileLayer(isDark ? darkTileUrl : lightTileUrl, {
            maxZoom: 16,
            subdomains: 'abcd',
        }).addTo(map)

        // Pulsing location marker pin
        const locationIcon = L.divIcon({
            className: 'custom-radar-pin',
            html: `<div class="relative flex items-center justify-center">
                <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-sky-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500 border-2 border-white shadow-lg"></span>
            </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })

        markerRef.current = L.marker([lat, lon], { icon: locationIcon }).addTo(map)
        mapInstance.current = map
        
        return () => {
            map.remove()
            mapInstance.current = null 
        }
    }, [])

    // 2. Dynamically switch map tile layer when theme changes
    useEffect(() => {
        if (baseTileLayerRef.current) {
            baseTileLayerRef.current.setUrl(isDark ? darkTileUrl : lightTileUrl)
        }
    }, [isDark])

    // 3. Pan map & update marker when city/coordinates change
    useEffect(() => { 
        if (mapInstance.current && markerRef.current) {
            mapInstance.current.setView([lat, lon], 7, { animate: true })
            markerRef.current.setLatLng([lat, lon])
        }
    }, [lat, lon])

    // 4. Fetch real-time radar frames from RainViewer API
    useEffect(() => {
        setLoading(true)
        fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.radar && data.radar.past) {
                    setHost(data.host || 'https://tilecache.rainviewer.com')
                    const allFrames = [...data.radar.past, ...(data.radar.nowcast || [])]

                    setFrames(allFrames)
                    setCurrentFrameIndex(allFrames.length - 1)
                }

                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to load RainViewer radar frames:', err)
                setLoading(false)
            })
    }, [])

    // 5. Update RainViewer Radar Layer when frame changes
    useEffect(() => {
        if (!mapInstance.current || frames.length === 0) return

        const frame = frames[currentFrameIndex]
        if (!frame) return 

        const radarTileUrl = `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`

        if (radarLayerRef.current) {
            radarLayerRef.current.setUrl(radarTileUrl)
        } else {
            radarLayerRef.current = L.tileLayer(radarTileUrl, {
                opacity: 0.75, 
                zIndex: 100
            }).addTo(mapInstance.current)
        }
    }, [currentFrameIndex, frames, host])

    // 6. Automatic Radar Animation Loop
    useEffect(() => {
        if (!isPlaying || frames.length <= 1) return

        const interval = setInterval(() => {
            setCurrentFrameIndex(prev => (prev + 1) % frames.length)
        }, 750)

        return () => clearInterval(interval)
    }, [isPlaying, frames])

    // Format timestamp for display
    const currentTimestamp = frames[currentFrameIndex]?.time
    const timeLabel = currentTimestamp
        ? new Date(currentTimestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Live'

    return (
        <div className={`backdrop-blur-md rounded-3xl p-4 border mb-6 overflow-hidden transition-all duration-300 ${
            isDark 
                ? 'bg-slate-800/40 border-slate-700/50' 
                : 'bg-white/80 border-slate-200/80 shadow-sm shadow-slate-200/50'
        }`}>
            {/* Header: Title & Time badge */}
            <div className="flex justify-between items-center mb-3">
                <div className={`flex items-center space-x-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span className="text-base">📡</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Live Weather Radar</span>
                </div>

                <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isDark 
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                            : 'bg-sky-50 text-sky-600 border-sky-200'
                    }`}>
                        {loading ? 'Syncing...' : `🕒 ${timeLabel}`}
                    </span>

                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                            isDark
                                ? 'bg-slate-700/60 hover:bg-slate-700 text-white border-slate-600/50'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                        title={isPlaying ? 'Pause radar animation' : 'Play radar animation'}
                    >
                        {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div className={`relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border shadow-inner ${
                isDark ? 'border-slate-700/60' : 'border-slate-200'
            }`}>
                <div ref={mapRef} className="w-full h-full z-10" />

                {/* Radar Rain Intensity Legend */}
                <div className={`absolute bottom-2 left-2 z-20 backdrop-blur-md px-2.5 py-1.5 rounded-xl border text-[10px] flex items-center space-x-2 shadow-lg ${
                    isDark 
                        ? 'bg-slate-900/85 border-slate-700/60 text-slate-300' 
                        : 'bg-white/90 border-slate-200/80 text-slate-700'
                }`}>
                    <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rain:</span>
                    <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#00ffff]" title="Light Rain" />
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#00ff00]" title="Moderate Rain" />
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#ffff00]" title="Heavy Rain" />
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#ff0000]" title="Very Heavy / Storm" />
                    </div>

                    <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Light → Heavy</span>
                </div>
            </div>
        </div>
    )
}