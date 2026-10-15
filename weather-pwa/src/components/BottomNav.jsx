import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const navItems = [ 
    { path: '/', label: 'Home' },
    { path: '/forecast', label: 'AI Forecast' },
]

export default function BottomNav() {
    const location = useLocation()
    const { theme, p } = useTheme()
    const isDark = theme === 'dark'

    // Weather-adaptive accent color for active tab
    const accent = p('accent')

    return (
        <nav 
            className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl rounded-full p-1 flex items-center space-x-1 transition-all duration-500 ${
                isDark 
                    ? 'bg-slate-900/90 shadow-2xl shadow-black/80'
                    : 'bg-white/90 shadow-lg shadow-slate-300/40'
            }`}

            style={{
                border: `1px solid ${isDark ? `${accent}30` : `${accent}25`}`,
                boxShadow: isDark
                    ? `0 0 20px ${accent}15, 0 8px 32px rgba(0,0,0,0.8)`
                    : `0 0 15px ${accent}10, 0 4px 16px rgba(0,0,0,0.1)`,
            }} 
        >

            {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                    <Link 
                        key={item.path}
                        to={item.path}
                        className={`px-4 py-1.5 rounded-full text-xs transition-all duration-300 ${
                            isActive
                                ? 'font-semibold shadow-sm' 
                                : isDark
                                    ? 'text-slate-400 font-medium hover:text-white hover:bg-slate-800/50'
                                    : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100'
                        }`}

                        style={isActive ? {
                            backgroundColor: `${accent}20`,
                            color: accent,
                            border: `1px solid ${accent}40`,
                        } : undefined}
                    >
                        <span className="text-xs tracking-wide">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}