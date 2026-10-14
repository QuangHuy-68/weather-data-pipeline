import { useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function WeatherBackground({ current, hourly }) {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    
    const currentHour = new Date().getHours()
    const isNight = currentHour < 6 || currentHour >= 18
    const isRaining = (current?.precipitation ?? 0) > 0 || (hourly?.[0]?.rainProb ?? 0) >= 60

    const isHotSun = !isRaining && !isNight && (current?.temperature ?? 28) >= 31

    // Generate static rain drops for smooth CSS animation
    const rainDrops = useMemo(() => {
        return Array.from({ length: 40 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 1.5}s`,
            duration: `${0.6 + Math.random() * 0.4}s`,
            opacity: 0.2 + Math.random() * 0.4
        }))
    }, [])

    // Generate static night stars
    const stars = useMemo(() => {
        return Array.from({ length: 35 }).map((_,i) => ({
            id: i,
            top: `${Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 3}s`,
            duration: `${2 + Math.random() * 2}s`,
            size: `${1 + Math.random() * 2}px`
        }))
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 transition-all duration-1000">
            {/* 1. Base Atmospheric Gradient */}
            <div className={`absolute inset-0 transition-colors duration-1000 ${
                isRaining
                    ? isDark 
                        ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
                        : 'bg-gradient-to-b from-slate-200 via-sky-100 to-slate-100'
                    :isNight
                        ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
                        : isHotSun
                            ? isDark
                                ? 'bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950'
                                : 'bg-gradient-to-b from-amber-100/60 via-sky-50 to-white'
                            : isDark
                                ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
                                : 'bg-gradient-to-b from-sky-50 via-slate-50 to-white'
            }`}/>

            {/* 2. RAIN EFFECT: Falling diagonal water drops */}
            {isRaining && (
                <div className="absolute inset-0">
                    <style>{`
                        @keyframes rainDropFall {
                            0% { transform: translateY(-30px) rotate(15deg); opacity: 0; }
                            50% { opacity: 0.6; }
                            100% { transform: translateY(105vh) rotate(15deg); opacity: 0.1; }
                        }
                    `}</style>
                    {rainDrops.map(drop => (
                        <div 
                            key={drop.id}
                            style={{
                                position: 'absolute',
                                left: drop.left,
                                top: '-20px',
                                width: '1.5px',
                                height: '24px',
                                background: isDark
                                    ? 'linear-gradient(to bottom, rgba(56, 189, 248, 0.6). rgba(255, 255, 255, 0.2))'
                                    : 'linear-gradient(to bottom, rgba(14, 165, 233, 0.7), rgba(56, 189, 248, 0.3))',

                                animation: `rainDropFall ${drop.duration} linear infinite`,
                                animationDelay: drop.delay, 
                                opacity: drop.opacity
                            }}
                        />
                    ))}
                </div>
            )}

            {/* 3. SUN GLOW EFFECT: Warm ambient radiating sun */}
            {isHotSun && (
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse pointer-events-none transition-all duration-1000 bg-amber-400" />
            )}

            {/* 4. NIGHT STARS EFFECT: Twinkling night sky */}
            {isNight && !isRaining && (
                <div className="absolute inset-0">
                    <style>{`
                        @keyframes starTwinkle {
                            0%, 100% {opacity: 0.2; transform: scale(0.8); }
                            50% { opacity: 0.85; transform: scale(1.2); }
                        }
                    `}</style>
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

            {/* 5. Subtle Floating Ambient Cloud/Haze Layer */}
            {!isRaining && !isHotSun && (
                <div className={`absolute top-1/4 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
                    isDark ? 'bg-sky-900/15' : 'bg-sky-200/40'
                }`} />
            )}
        </div>
    )
}