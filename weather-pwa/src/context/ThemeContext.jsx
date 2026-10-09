import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('skypulse_theme') || 'light'
    })

    useEffect(() => {
        localStorage.setItem('skypulse_theme', theme) 
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
            document.body.className = 'bg-slate-50 text-slate-900 transition-colors duration-300'
        }
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}