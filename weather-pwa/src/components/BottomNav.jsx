import {Link, useLocation} from 'react-router-dom'

const navItems = [ 
    { path: '/', 
      icon: '🏠',
      label: 'Home'
    },

    { path: '/forecast', 
      icon: '🤖',
      label: 'AI Forecast'
    },
]


export default function BottomNav() {
    const location = useLocation()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/80 px-6 py-2">
            <div className="max-w-md mx-auto flex justify-around items-center">
                {navItems.map(item => {
                    const isActive = location.pathname === item.path
                    return (
                        <Link 
                            key={item.path}
                            to={item.path}
                            className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${location.pathname === item.path ? 'text-sky-400' : 'text-slate-400 hover:text-white'}`}>
                    
                            <span className="text-xl mb-1">{item.icon}</span>
                            <span className="text-[11px] tracking-wide">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}