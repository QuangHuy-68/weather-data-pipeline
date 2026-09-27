import { useEffect, useRef, useState }  from "react";
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function WeatherRadar({ lat = 10.8231, lon = 106.6297, locationName = 'Location' }) {
    const mapRef = useRef(null)
    const mapInstance = useRef(null)
    const raderLayerRef = useRef(null)
    const markerRef = useRef(null)

    const [frames, setFrames] = useState([])
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [host, setHost] = useState('https://tilecache.rainviewer.com')
    const [loading, setLoading] = useState(true)

    // 1. Initialize Leaflet Map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return

        // Create Leaflet map centered at selected coordinates
        const map =L.map(mapRef,current, { 
            center: [lat, lon],
            zoom: 7,
            zoomControl: false,
            attributionControl: false
        })

        // Dark Matter Base Map (CartoDB) - matches dark UI theme
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
        }).addTo(map)

        // Pulsing location marker pin
        const locationIcon = L.divIcon({
            className: 'custom-radar-pin',
            html: `<div class="relative flex items-center justify-center">
                <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-sky-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500 border-2 border-white shadow-lg"></span>
            </div>`,

            iconSize: [24,24],
            iconAnchor: [12, 12]
        })

        markerRef.current = L.marker([lat, lon], { icon: locationIcon }). addTo(map)
        mapInstance.current = map
        
        return () => {
            map.remove()
            mapInstance.current = null 
        }
    }, [])

    // 2. Pan map & update marker when city/coordinates change
    useEffect(() => { 
        if (mapInstance.current && markerRef.current) {
            mapInstance.current.setView([lat, lon], 7, { animate: true })
            markerRef.current.setLatLng([lat, lon])
        }
    }, [lat, lon])

    // 3. Fetch real-time radar frames from RainViewer API
    useEffect(() => {
        setLoading(true)
        fetch('https://api.rainviewer.com/public/weather-maps.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.radar && data.radar.past) {
                    setHost(data.host || 'https://tilecache.rainviewer.com')
                    const allFrames = [...data.radar.past, ...L(data.radar.nowcast || [])]

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

    // 4. Update RainViewer Radar Layer when frame changes
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

    // 5. Automatic Radar Animation Loop
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
        <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-4 border border-slate-700/50 mb-6 overflow-hidden">
            {/* Header: Title & Time badge */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2 text-slate-300">
                    <span className="text-base">📡</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Live Weather Radar</span>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
                        {loading ? 'Syncing...' : `🕒 ${timeLabel}`}
                    </span>

                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="text-xs bg-slate-700/60 hover:bg-slate--700 text-white px-2.5 py-0.5 rounded-full border border-slate-600/50 transition-colors"
                        title={isPlaying ? 'Pause radar animation' : 'Play radar animation'}
                    >
                        {isPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner">
                <div ref={mapRef} className="w-full h-full z-10" />

                {/* Radar Rain Intensity Legend */}
                <div className="absolute bottom-2 left-2 z-20 g-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-[10px] text-slate-300 flex items-center space-x-2 shadow-lg">
                    <span className="text-[9px] text-slate-400">Rain:</span>
                    <div className="flex items-center space-x-1">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#00ffff]" title="Light Rain" />
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#00ff00]" title="Moderate Rain" />
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#ffff00]" title="Heavy Rain" />
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#ff0000]" title="Very Heavy / Storm" />
                    </div>

                    <span className="text-[9px] text-slate-400">Light → Heavy</span>
                </div>
            </div>
        </div>
    )
}