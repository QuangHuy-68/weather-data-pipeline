import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const navItems = [ 
    { path: '/', label: 'Home' },
    { path: '/forecast', label: 'AI Forecast' },
]

export default function BottomNav() {
    const location = useLocation()
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <nav 
            className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl rounded-full p-1 flex items-center space-x-1 transition-all duration-300 ${
                isDark
                    ? 'bg-slate-900/90 border border-slate-700/60 shadow-2xl shadow-black/80'
                    : 'bg-white/90 border border-slate-200/80 shadow-lg shadow-slate-300/40'
            }`}
        >

            {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                    <Link 
                        key={item.path}
                        to={item.path}
                        className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                            isActive 
                                ? isDark
                                    ? 'bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30 shadow-sm' 
                                    : 'bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/25'
                                : isDark
                                    ? 'text-slate-400 font-medium hover:text-white hover:bg-slate-800/50'
                                    : 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100'
                        }`}
                    >
                        <span className="text-xs tracking-wide">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}