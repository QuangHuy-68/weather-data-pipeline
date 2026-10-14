// src/components/WeatherBackground.jsx
import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function WeatherBackground({ current, hourly }) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    
    // 1. Time & Weather Detection
    const currentHour = new Date().getHours()
    const isNight = currentHour < 6 || currentHour >= 18
    const weatherCode = hourly?.[0]?.code ?? 0
    const rainProb = hourly?.[0]?.rainProb ?? 0
    const precipitation = current?.precipitation ?? 0
    const temperature = current?.temperature ?? 28

    const isStormy = weatherCode >= 95
    const isRaining = precipitation > 0 || rainProb >= 40 || isStormy
    const isHotSun = !isRaining && !isNight && temperature >= 32

    // 2. LAYER 1: Far Rain (Nhỏ, mờ, rơi chậm - tạo cảm giác không gian xa)
    const farRain = useMemo(() => {
        return Array.from({ length: 45 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 105}%`,
            delay: `${Math.random() * 2}s`,
            duration: `${0.8 + Math.random() * 0.4}s`,
            height: `${24 + Math.random() * 16}px`,
        }))
    }, [])

    // 3. LAYER 2: Midground Rain (Mật độ chính, vệt nước trong suốt tự nhiên)
    const midRain = useMemo(() => {
        return Array.from({ length: 55 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 105}%`,
            delay: `${Math.random() * 1.6}s`,
            duration: `${0.55 + Math.random() * 0.3}s`,
            height: `${45 + Math.random() * 25}px`,
        }))
    }, [])

    // 4. LAYER 3: Near Rain (Rơi sát màn hình, vệt dài, lướt rất nhanh)
    const nearRain = useMemo(() => {
        return Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 105}%`,
            delay: `${Math.random() * 1.2}s`,
            duration: `${0.35 + Math.random() * 0.2}s`,
            height: `${80 + Math.random() * 40}px`,
        }))
    }, [])

    // 5. Starfield for clear nights
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

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transition-all duration-1000">
            
            {/* ── 1. CINEMATIC ATMOSPHERIC SKY GRADIENT ── */}
            <div className={`absolute inset-0 transition-all duration-1000 ${
                isStormy
                    ? isDark
                        ? 'bg-gradient-to-b from-[#090d16] via-[#101426] to-[#05070c]'
                        : 'bg-gradient-to-b from-[#475569] via-[#64748b] to-[#94a3b8]'
                    : isRaining
                        ? isDark
                            ? 'bg-gradient-to-b from-[#080d1a] via-[#0d1627] to-[#040812]'
                            : 'bg-gradient-to-b from-[#cbd5e1] via-[#e2e8f0] to-[#f1f5f9]'
                        : isNight
                            ? 'bg-gradient-to-b from-[#020617] via-[#0b1329] to-[#020617]'
                            : isHotSun
                                ? isDark
                                    ? 'bg-gradient-to-b from-[#241407] via-[#0f172a] to-[#020617]'
                                    : 'bg-gradient-to-b from-[#fef3c7] via-[#f0f9ff] to-[#ffffff]'
                                : isDark
                                    ? 'bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#020617]'
                                    : 'bg-gradient-to-b from-[#e0f2fe] via-[#f8fafc] to-[#ffffff]'
            }`}/>

            {/* ── 2. VIGNETTE SHADOW (Tạo chiều sâu điện ảnh 4 góc) ── */}
            <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/40 pointer-events-none" />

            {/* ── 3. REALISTIC RAIN EFFECT (3-LAYER DEPTH ENGINE) ── */}
            {isRaining && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    
                    {/* Layer 1: Far Rain (Nền sâu - nhỏ & mờ) */}
                    {farRain.map(drop => (
                        <div
                            key={`far-${drop.id}`}
                            style={{
                                position: 'absolute',
                                left: drop.left,
                                top: '-60px',
                                width: '1px',
                                height: drop.height,
                                background: isDark
                                    ? 'linear-gradient(to bottom, rgba(148, 163, 184, 0), rgba(186, 230, 253, 0.35))'
                                    : 'linear-gradient(to bottom, rgba(71, 85, 105, 0), rgba(51, 65, 85, 0.25))',
                                filter: 'blur(0.8px)',
                                animation: `realisticRainFar ${drop.duration} linear infinite`,
                                animationDelay: drop.delay,
                            }}
                        />
                    ))}

                    {/* Layer 2: Midground Rain (Lớp mưa tự nhiên trong suốt) */}
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
                                background: isDark
                                    ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(224, 242, 254, 0.75))'
                                    : 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(56, 189, 248, 0.65))',
                                animation: `realisticRainMid ${drop.duration} linear infinite`,
                                animationDelay: drop.delay,
                            }}
                        />
                    ))}

                    {/* Layer 3: Near Rain (Sát kính màn hình - vệt dài & tốc độ cao) */}
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
                                background: isDark
                                    ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.85))'
                                    : 'linear-gradient(to bottom, rgba(14, 165, 233, 0.05), rgba(2, 132, 199, 0.8))',
                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))',
                                animation: `realisticRainNear ${drop.duration} linear infinite`,
                                animationDelay: drop.delay,
                            }}
                        />
                    ))}

                    {/* Ground Mist / Vapor Haze (Hơi nước bốc lên từ mặt đất khi mưa) */}
                    <div 
                        className="absolute bottom-0 left-0 right-0 h-80 pointer-events-none"
                        style={{
                            background: isDark
                                ? 'radial-gradient(ellipse at bottom, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0) 70%)'
                                : 'radial-gradient(ellipse at bottom, rgba(148, 163, 184, 0.25) 0%, rgba(255, 255, 255, 0) 70%)',
                            filter: 'blur(35px)',
                            animation: 'mistVaporDrift 7s ease-in-out infinite'
                        }}
                    />

                    {/* Rolling Dark Storm Cloud Atmosphere */}
                    <div 
                        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[120vw] h-96 rounded-full pointer-events-none"
                        style={{
                            background: isDark
                                ? 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0) 75%)'
                                : 'radial-gradient(ellipse at center, rgba(148, 163, 184, 0.5) 0%, rgba(241, 245, 249, 0) 75%)',
                            filter: 'blur(50px)',
                            animation: 'stormAtmospherePulse 9s ease-in-out infinite'
                        }}
                    />
                </div>
            )}

            {/* ── 4. WARM RADIATING SUN (Trời nắng) ── */}
            {isHotSun && (
                <div className="absolute -top-28 -right-28 w-[450px] h-[450px] rounded-full blur-3xl opacity-35 animate-pulse pointer-events-none bg-amber-400/80" />
            )}

            {/* ── 5. TWINKLING NIGHT STARS (Đêm quang đãng) ── */}
            {isNight && !isRaining && (
                <div className="absolute inset-0">
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