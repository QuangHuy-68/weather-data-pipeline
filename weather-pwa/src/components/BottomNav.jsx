import { Link, useLocation } from 'react-router-dom'

const navItems = [ 
    { path: '/', label: 'Home' },
    { path: '/forecast', label: 'AI Forecast' },
]

export default function BottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-full p-1 shadow-2xl shadow-black/80 flex items-center space-x-1">
            {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                    <Link 
                        key={item.path}
                        to={item.path}
                        className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                            isActive 
                                ? 'bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30 shadow-sm' 
                                : 'text-slate-400 font-medium hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        <span className="text-xs tracking-wide">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}