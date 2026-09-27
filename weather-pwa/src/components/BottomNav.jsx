import { Link, useLocation } from 'react-router-dom'

const navItems = [ 
    { 
        path: '/', 
        icon: '🏠',
        label: 'Home'
    },
    { 
        path: '/forecast', 
        icon: '🤖',
        label: 'AI Forecast'
    },
]

export default function BottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-full px-3 py-1.5 shadow-2xl shadow-black/80 flex items-center space-x-1">
            {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                    <Link 
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            isActive 
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        <span className="text-base select-none">{item.icon}</span>
                        <span className="text-[11px] tracking-wide">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}