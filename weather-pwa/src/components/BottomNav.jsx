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
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex">
            {navItems.map(item => (
                <Link 
                    key={item.path}
                    to={item.path}
                    className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${location.pathname === item.path ? 'text-sky-400' : 'text-slate-400 hover:text-white'}`}>
                    
                    <span className="text-xl mb-1">{item.icon}</span>
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}