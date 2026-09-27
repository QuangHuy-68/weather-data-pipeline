import { Link, useLocation } from 'react-router-dom'

const navItems = [ 
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/forecast', icon: '🤖', label: 'AI Forecast' },
]

export default function BottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/85 backdrop-blur-xl border-t border-slate-800/80 px-4 py-1">
            <div className="max-w-xs mx-auto flex justify-around items-center">
                {navItems.map(item => {
                    const isActive = location.pathname === item.path
                    return (
                        <Link 
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center py-1 text-xs transition-colors ${
                                isActive ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <span className="text-base mb-0.5">{item.icon}</span>
                            <span className="text-[10px] tracking-wide">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}