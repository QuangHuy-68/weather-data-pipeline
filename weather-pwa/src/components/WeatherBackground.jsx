// src/components/WeatherBackground.jsx
import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function WeatherBackground({ current, hourly }) {
    const { theme, overrideMode, overrideTime } = useTheme()
    const isDark = theme === 'dark'
    
    // 1. Time & Meteorological Detection
    const currentHour = new Date().getHours()
    const isSunrise = overrideTime ? overrideTime === 'sunrise' : (currentHour >= 5 && currentHour < 7)
    const isSunset = overrideTime ? overrideTime === 'sunset' : (currentHour >= 17 && currentHour < 19)
    const isNoon = overrideTime ? overrideTime === 'noon' : (currentHour >= 11 && currentHour < 14)
    const isMidnight = overrideTime ? overrideTime === 'midnight' : (currentHour >= 23 || currentHour < 4)
    const isNight = overrideTime ? (overrideTime === 'midnight') : (currentHour < 6 || currentHour >= 18)

    const weatherCode = hourly?.[0]?.code ?? current?.weather_code ?? 0
    const rainProb = hourly?.[0]?.rainProb ?? 0
    const precipitation = current?.precipitation ?? 0
    const temperature = overrideMode === 'hot' ? 36 : overrideMode === 'snowy' ? -3 : (current?.temperature ?? 28)
    const windSpeed = current?.wind_speed ?? 10

    // Kiểm tra mưa: nếu người dùng bật theme mưa hoặc thời tiết thật có mưa
    const realIsRaining = precipitation > 0 || rainProb >= 40 || weatherCode >= 95
    const isRaining = overrideMode === 'rainy' || overrideMode === 'stormy' || (realIsRaining && overrideMode !== 'clear')
    const isStormy = overrideMode === 'stormy' || (weatherCode >= 95 && overrideMode !== 'clear')
    const isHotSun = overrideMode ? overrideMode === 'hot' : (!isRaining && !isNight && temperature >= 32)
    const isFreezing = overrideMode === 'snowy' || temperature <= 0
    const isSnowing = overrideMode ? overrideMode === 'snowy' : (weatherCode >= 71 && weatherCode <= 77)
    const isCloudy = overrideMode ? (overrideMode === 'cloudy' || isRaining) : ((weatherCode >= 2 && weatherCode <= 3) || isRaining)
    const isFoggy = overrideMode ? overrideMode === 'foggy' : (weatherCode === 45 || weatherCode === 48)

    // Góc mưa nghiêng theo vận tốc gió thực tế (6° đến 24°)
    const rainSlant = Math.min(24, Math.max(6, Math.round(windSpeed * 0.75)))

    // 2. Far Rain Layer (Mưa xa mờ ảo)
    const farRain = useMemo(() => {
        return Array.from({ length: 45 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 105}%`,
            delay: `${Math.random() * 2}s`,
            duration: `${0.8 + Math.random() * 0.4}s`,
            height: `${24 + Math.random() * 16}px`,
        }))
    }, [])

    // 3. Midground Rain Layer
    const midRain = useMemo(() => {
        return Array.from({ length: 55 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 105}%`,
            delay: `${Math.random() * 1.6}s`,
            duration: `${0.55 + Math.random() * 0.3}s`,
            height: `${45 + Math.random() * 25}px`,
        }))
    }, [])

    // 4. Near Rain Layer (Mưa gần vệt sáng rõ nét)
    const nearRain = useMemo(() => {
        return Array.from({ length: 28 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 105}%`,
            delay: `${Math.random() * 1.2}s`,
            duration: `${0.35 + Math.random() * 0.2}s`,
            height: `${80 + Math.random() * 45}px`,
        }))
    }, [])

    // 5. Rain Splashes (Giọt nước tóe bắn ở mặt đất)
    const splashRings = useMemo(() => {
        return Array.from({ length: 16 }).map((_, i) => ({
            id: i,
            left: `${5 + Math.random() * 90}%`,
            bottom: `${4 + Math.random() * 18}px`,
            size: `${12 + Math.random() * 16}px`,
            delay: `${Math.random() * 2}s`,
            duration: `${0.6 + Math.random() * 0.5}s`,
        }))
    }, [])

    // 6. Micro-beads đọng tĩnh trên kính (Condensation Beads)
    const staticDroplets = useMemo(() => {
        return Array.from({ length: 32 }).map((_, i) => ({
            id: i,
            left: `${4 + Math.random() * 92}%`,
            top: `${6 + Math.random() * 85}%`,
            size: `${2.5 + Math.random() * 4}px`,
            opacity: 0.4 + Math.random() * 0.45,
        }))
    }, [])

    // 7. Giọt nước lớn trôi trượt ngắt quãng trên kính (Meandering Droplets)
    const runningDroplets = useMemo(() => {
        return Array.from({ length: 14 }).map((_, i) => ({
            id: i,
            left: `${6 + Math.random() * 88}%`,
            top: `${8 + Math.random() * 55}%`,
            size: `${5 + Math.random() * 5}px`,
            delay: `${Math.random() * 6}s`,
            duration: `${4 + Math.random() * 4}s`,
        }))
    }, [])

    // 8. Mây rách bay nhanh (Scud Clouds)
    const scudClouds = useMemo(() => {
        return Array.from({ length: 5 }).map((_, i) => ({
            id: i,
            top: `${8 + i * 9}%`,
            delay: `${i * 3 + Math.random() * 2}s`,
            duration: `${14 + Math.random() * 8}s`,
            width: `${260 + Math.random() * 200}px`,
            height: `${70 + Math.random() * 50}px`,
            opacity: 0.25 + Math.random() * 0.2,
        }))
    }, [])

    // 9. Sao đêm cho trời quang
    const stars = useMemo(() => {
        return Array.from({ length: 45 }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 65}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 3}s`,
            duration: `${2 + Math.random() * 2}s`,
            size: `${1 + Math.random() * 2}px`
        }))
    }, [])

    // 10. Bông tuyết
    const snowflakes = useMemo(() => {
        return Array.from({ length: 60 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 105}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${4 + Math.random() * 4}s`,
            size: `${3 + Math.random() * 5}px`,
            opacity: 0.4 + Math.random() * 0.5,
        }))
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-all duration-1000">
            
            {/* ── 1. SKY GRADIENT KHÍ QUYỂN ── */}
            <div className={`absolute inset-0 transition-all duration-1000 ${
                isStormy
                    ? isDark
                        ? 'bg-gradient-to-b from-[#070b14] via-[#0f172a] to-[#03060c]'
                        : 'bg-gradient-to-b from-[#334155] via-[#475569] to-[#64748b]'
                : isSunrise
                    ? isRaining
                        ? isDark
                            ? 'bg-gradient-to-b from-[#2d124d]/85 via-[#4a154b]/70 to-[#040812]'
                            : 'bg-gradient-to-b from-[#fed7aa]/90 via-[#fbcfe8]/70 to-[#cbd5e1]'
                        : isDark
                            ? 'bg-gradient-to-b from-[#2d124d]/60 via-[#581c87]/30 to-[#020617]'
                            : 'bg-gradient-to-b from-[#fed7aa] via-[#fce7f3] to-[#ffffff]'
                : isSunset
                    ? isRaining
                        ? isDark
                            ? 'bg-gradient-to-b from-[#4c0519]/80 via-[#2e1065]/70 to-[#040812]'
                            : 'bg-gradient-to-b from-[#fde68a]/90 via-[#f472b6]/50 to-[#94a3b8]'
                        : isDark
                            ? 'bg-gradient-to-b from-[#4c0519]/50 via-[#2e1065]/40 to-[#020617]'
                            : 'bg-gradient-to-b from-[#fde68a] via-[#f472b6]/30 to-[#e0e7ff]'
                : isMidnight
                    ? isRaining
                        ? 'bg-gradient-to-b from-[#020617] via-[#091328] to-[#01040f]'
                        : 'bg-gradient-to-b from-[#01040f] via-[#040b1e] to-[#000206]'
                : isRaining
                    ? isDark
                        ? 'bg-gradient-to-b from-[#070e1b] via-[#0f1a2e] to-[#030710]'
                        : 'bg-gradient-to-b from-[#94a3b8] via-[#cbd5e1] to-[#e2e8f0]'
                : isFreezing
                    ? isDark
                        ? 'bg-gradient-to-b from-[#081220] via-[#0f2137] to-[#040913]'
                        : 'bg-gradient-to-b from-[#dbeafe] via-[#eff6ff] to-[#f8fafc]'
                : isSnowing
                    ? isDark
                        ? 'bg-gradient-to-b from-[#0c1929] via-[#1a2744] to-[#0a101f]'
                        : 'bg-gradient-to-b from-[#e0e7ff] via-[#f0f4ff] to-[#ffffff]'
                : isNoon && isHotSun
                    ? isDark
                        ? 'bg-gradient-to-b from-[#241407] via-[#0f172a] to-[#020617]'
                        : 'bg-gradient-to-b from-[#fef3c7] via-[#f0f9ff] to-[#ffffff]'
                    : isDark
                        ? 'bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#020617]'
                        : 'bg-gradient-to-b from-[#e0f2fe] via-[#f8fafc] to-[#ffffff]'
            }`}/>

            {/* ── 2. ĐÁM MÂY DÔNG TẦNG CAO U ÁM (HEAVY STORM SHELF CLOUD) ── */}
            {isRaining && (
                <>
                    {/* Mây dông khổng lồ bao phủ nửa trên màn hình */}
                    <div 
                        className="absolute -top-24 -left-1/4 w-[150vw] h-[55vh] rounded-b-[100%] pointer-events-none transition-all duration-1000"
                        style={{
                            background: isDark
                                ? 'radial-gradient(ellipse at 50% 10%, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.75) 50%, transparent 85%)'
                                : 'radial-gradient(ellipse at 50% 10%, rgba(71, 85, 105, 0.75) 0%, rgba(100, 116, 139, 0.5) 55%, transparent 85%)',
                            filter: 'blur(35px)',
                            animation: 'stormShelfBillow 12s ease-in-out infinite',
                        }}
                    />

                    {/* Mây rách tả tơi lướt nhanh theo chiều gió (Scud clouds) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {scudClouds.map(scud => (
                            <div
                                key={`scud-${scud.id}`}
                                style={{
                                    position: 'absolute',
                                    top: scud.top,
                                    width: scud.width,
                                    height: scud.height,
                                    borderRadius: '9999px',
                                    background: isDark
                                        ? 'radial-gradient(ellipse, rgba(51, 65, 85, 0.35) 0%, rgba(30, 41, 59, 0.1) 60%, transparent 80%)'
                                        : 'radial-gradient(ellipse, rgba(148, 163, 184, 0.45) 0%, rgba(203, 213, 225, 0.2) 60%, transparent 80%)',
                                    filter: 'blur(16px)',
                                    opacity: scud.opacity,
                                    animation: `scudCloudDrift ${scud.duration} linear infinite`,
                                    animationDelay: scud.delay,
                                }}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* ── 3. HÀO QUANG HOÀNG HÔN / BÌNH MINH (XUYÊN QUA MÀN MƯA) ── */}
            {(isSunrise || isSunset) && (
                <div 
                    className={`absolute -bottom-20 left-1/2 -translate-x-1/2 w-[120vw] h-96 rounded-full pointer-events-none blur-3xl transition-all duration-1000 ${
                        isRaining ? 'opacity-35' : 'opacity-50'
                    }`}
                    style={{
                        background: isSunrise 
                            ? 'radial-gradient(ellipse at center, rgba(251, 146, 60, 0.5) 0%, rgba(244, 114, 182, 0) 70%)'
                            : 'radial-gradient(ellipse at center, rgba(244, 63, 94, 0.5) 0%, rgba(139, 92, 246, 0) 70%)'
                    }}
                />
            )}

            {/* ── 4. FROSTED ICE VIGNETTE ── */}
            {isFreezing && (
                <div 
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                        boxShadow: 'inset 0 0 100px rgba(125, 211, 252, 0.25), inset 0 0 40px rgba(255, 255, 255, 0.4)',
                        border: '1px solid rgba(186, 230, 253, 0.2)',
                        animation: 'frostGlowPulse 6s ease-in-out infinite',
                    }}
                />
            )}

            {/* ── 5. VOLUMETRIC SUN GOD RAYS ── */}
            {isHotSun && (
                <div className="absolute -top-32 -right-32 w-[650px] h-[650px] pointer-events-none overflow-hidden">
                    <div 
                        className="w-full h-full rounded-full"
                        style={{
                            background: 'conic-gradient(from 0deg, rgba(251, 191, 36, 0.35) 0deg, transparent 25deg, rgba(245, 158, 11, 0.3) 60deg, transparent 90deg, rgba(251, 191, 36, 0.4) 140deg, transparent 180deg)',
                            filter: 'blur(32px)',
                            animation: 'sunRayRotate 24s ease-in-out infinite',
                        }}
                    />
                </div>
            )}

            {/* ── 6. CINEMATIC VIGNETTE SHADOW ── */}
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/40 pointer-events-none" />

            {/* ── 7. HỆ THỐNG MƯA & GIỌT NƯỚC BÁM KÍNH ĐA TẦNG ── */}
            {isRaining && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    
                    {/* Tầng 1: Mưa xa (Far Rain) */}
                    {farRain.map(drop => (
                        <div
                            key={`far-${drop.id}`}
                            style={{
                                position: 'absolute',
                                left: drop.left,
                                top: '-60px',
                                width: '1px',
                                height: drop.height,
                                transform: `rotate(${rainSlant - 2}deg)`,
                                background: isDark
                                    ? 'linear-gradient(to bottom, rgba(148, 163, 184, 0), rgba(186, 230, 253, 0.35))'
                                    : 'linear-gradient(to bottom, rgba(71, 85, 105, 0), rgba(51, 65, 85, 0.25))',
                                filter: 'blur(0.8px)',
                                animation: `realisticRainFar ${drop.duration} linear infinite`,
                                animationDelay: drop.delay,
                            }}
                        />
                    ))}

                    {/* Tầng 2: Mưa trung (Mid Rain) */}
                    {midRain.map(drop => (
                        <div
                            key={`mid-${drop.id}`}
                            style={{
                                position: 'absolute',
                                left: drop.left,
                                top: '-80px',
                                width: '1.5px',
                                height: drop.height,
                                borderRadius: '9999px',
                                transform: `rotate(${rainSlant}deg)`,
                                background: isDark
                                    ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(224, 242, 254, 0.75))'
                                    : 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(56, 189, 248, 0.65))',
                                animation: `realisticRainMid ${drop.duration} linear infinite`,
                                animationDelay: drop.delay,
                            }}
                        />
                    ))}

                    {/* Tầng 3: Mưa gần sắc nét (Near Rain) */}
                    {nearRain.map(drop => (
                        <div
                            key={`near-${drop.id}`}
                            style={{
                                position: 'absolute',
                                left: drop.left,
                                top: '-120px',
                                width: '2px',
                                height: drop.height,
                                borderRadius: '9999px',
                                transform: `rotate(${rainSlant + 2}deg)`,
                                background: isDark
                                    ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.9))'
                                    : 'linear-gradient(to bottom, rgba(14, 165, 233, 0.05), rgba(2, 132, 199, 0.85))',
                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.35))',
                                animation: `realisticRainNear ${drop.duration} linear infinite`,
                                animationDelay: drop.delay,
                            }}
                        />
                    ))}

                    {/* Tầng 4: Vòng nước tóe bắn (Rain Splashes khi chạm đáy) */}
                    {splashRings.map(splash => (
                        <div
                            key={`splash-${splash.id}`}
                            style={{
                                position: 'absolute',
                                left: splash.left,
                                bottom: splash.bottom,
                                width: splash.size,
                                height: splash.size,
                                borderRadius: '50%',
                                border: isDark ? '1.5px solid rgba(224, 242, 254, 0.7)' : '1.5px solid rgba(56, 189, 248, 0.6)',
                                animation: `rainSplashRing ${splash.duration} ease-out infinite`,
                                animationDelay: splash.delay,
                            }}
                        />
                    ))}

                    {/* Tầng 5: Lớp sương hơi ẩm ngưng tụ viền kính (Glass Condensation Haze) */}
                    <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            boxShadow: isDark
                                ? 'inset 0 0 90px rgba(148, 163, 184, 0.15), inset 0 0 30px rgba(255, 255, 255, 0.08)'
                                : 'inset 0 0 80px rgba(203, 213, 225, 0.4), inset 0 0 25px rgba(255, 255, 255, 0.3)',
                            animation: 'condensationHazePulse 8s ease-in-out infinite',
                        }}
                    />

                    {/* Tầng 6: Hạt sương li ti đọng tĩnh 3D trên kính (Static Beads) */}
                    {staticDroplets.map(drop => (
                        <div
                            key={`bead-${drop.id}`}
                            style={{
                                position: 'absolute',
                                left: drop.left,
                                top: drop.top,
                                width: drop.size,
                                height: drop.size,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 45%, rgba(148,163,184,0.2) 80%)',
                                boxShadow: 'inset 0.5px 0.5px 1px rgba(255,255,255,0.9), 0.5px 1px 1.5px rgba(0,0,0,0.3)',
                                opacity: drop.opacity,
                            }}
                        />
                    ))}

                    {/* Tầng 7: Giọt nước lớn trôi trượt ngắt quãng trên kính (Meandering Droplets) */}
                    {runningDroplets.map(drop => (
                        <div
                            key={`running-${drop.id}`}
                            style={{
                                position: 'absolute',
                                left: drop.left,
                                top: drop.top,
                                width: drop.size,
                                height: drop.size,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, rgba(255,255,255,0.7) 40%, rgba(148,163,184,0.3) 75%)',
                                boxShadow: 'inset 1px 1px 1.5px rgba(255,255,255,0.95), 0 2px 4px rgba(0,0,0,0.35)',
                                animation: `glassDropletMeander ${drop.duration} cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                                animationDelay: drop.delay,
                            }}
                        />
                    ))}

                    {/* Tầng 8: Hơi sương bốc lên từ mặt đất (Ground Mist) */}
                    <div 
                        className="absolute bottom-0 left-0 right-0 h-72 pointer-events-none"
                        style={{
                            background: isDark
                                ? 'radial-gradient(ellipse at bottom, rgba(56, 189, 248, 0.09) 0%, rgba(15, 23, 42, 0) 70%)'
                                : 'radial-gradient(ellipse at bottom, rgba(148, 163, 184, 0.25) 0%, rgba(255, 255, 255, 0) 70%)',
                            filter: 'blur(30px)',
                            animation: 'mistVaporDrift 7s ease-in-out infinite'
                        }}
                    />
                </div>
            )}

            {/* ── 8. LIGHTNING FLASH ── */}
            {isStormy && (
                <div 
                    className="absolute inset-0 animate-lightning-flash pointer-events-none z-10"
                    style={{
                        background: isDark
                            ? 'radial-gradient(ellipse at 40% 20%, rgba(167, 139, 250, 0.6) 0%, rgba(255, 255, 255, 0.15) 40%, transparent 75%)'
                            : 'radial-gradient(ellipse at 40% 20%, rgba(139, 92, 246, 0.3) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 75%)',
                    }}
                />
            )}

            {/* ── 9. SNOWFALL ── */}
            {isSnowing && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {snowflakes.map(flake => (
                        <div
                            key={`snow-${flake.id}`}
                            style={{
                                position: 'absolute',
                                left: flake.left,
                                top: '-20px',
                                width: flake.size,
                                height: flake.size,
                                borderRadius: '50%',
                                backgroundColor: isDark ? '#ffffff' : '#94a3b8',
                                opacity: flake.opacity,
                                filter: 'blur(0.5px)',
                                animation: `snowfallDrift ${flake.duration} linear infinite`,
                                animationDelay: flake.delay,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ── 10. MÂY TRỜI QUANG (KHI KHÔNG MƯA) ── */}
            {isCloudy && !isRaining && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {scudClouds.map(cloud => (
                        <div
                            key={`cloud-fair-${cloud.id}`}
                            style={{
                                position: 'absolute',
                                top: cloud.top,
                                width: cloud.width,
                                height: cloud.height,
                                borderRadius: '9999px',
                                background: isDark
                                    ? 'radial-gradient(ellipse, rgba(148, 163, 184, 0.15) 0%, transparent 70%)'
                                    : 'radial-gradient(ellipse, rgba(203, 213, 225, 0.4) 0%, transparent 70%)',
                                filter: 'blur(10px)',
                                opacity: cloud.opacity,
                                animation: `cloudDrift ${cloud.duration * 1.5} linear infinite`,
                                animationDelay: cloud.delay,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* ── 11. DENSE FOG ── */}
            {isFoggy && (
                <>
                    <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: isDark
                                ? 'linear-gradient(to bottom, rgba(100, 116, 139, 0.15) 0%, rgba(71, 85, 105, 0.25) 50%, rgba(51, 65, 85, 0.1) 100%)'
                                : 'linear-gradient(to bottom, rgba(226, 232, 240, 0.4) 0%, rgba(203, 213, 225, 0.5) 50%, rgba(241, 245, 249, 0.3) 100%)',
                            filter: 'blur(20px)',
                            animation: 'fogOverlayPulse 8s ease-in-out infinite',
                        }}
                    />
                    <div 
                        className="absolute bottom-0 left-0 right-0 h-[50vh] pointer-events-none"
                        style={{
                            background: isDark
                                ? 'radial-gradient(ellipse at bottom, rgba(148, 163, 184, 0.15) 0%, transparent 80%)'
                                : 'radial-gradient(ellipse at bottom, rgba(203, 213, 225, 0.4) 0%, transparent 80%)',
                            filter: 'blur(40px)',
                            animation: 'mistVaporDrift 10s ease-in-out infinite',
                        }}
                    />
                </>
            )}

            {/* ── 12. SUN SPHERE ── */}
            {isHotSun && (
                <div className="absolute -top-28 -right-28 w-[450px] h-[450px] rounded-full blur-3xl opacity-35 animate-pulse pointer-events-none bg-amber-400/80" />
            )}

            {/* ── 13. NIGHT STARS ── */}
            {isNight && !isRaining && !isSnowing && (
                <div className="absolute inset-0">
                    <div className="absolute top-10 right-12 w-48 h-48 rounded-full bg-sky-200/10 blur-2xl pointer-events-none" />
                    {stars.map(star => (
                        <div
                            key={star.id}
                            style={{
                                position: 'absolute',
                                top: star.top,
                                left: star.left,
                                width: star.size,
                                height: star.size,
                                borderRadius: '50%',
                                backgroundColor: isDark ? '#ffffff' : '#94a3b8',
                                animation: `starTwinkle ${star.duration} ease-in-out infinite`,
                                animationDelay: star.delay
                            }}
                        />
                    ))}
                </div>            
            )}
        </div>
    )
}