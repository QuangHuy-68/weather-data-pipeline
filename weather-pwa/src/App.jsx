import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider , useTheme } from './context/ThemeContext'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Forecast from './pages/Forecast'

function AppContent() {
  const {theme} = useTheme()

  return (
    <div className="min-h-screen text-white transition-colors duration-500">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/forecast" element={<Forecast />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider> 
  )
}