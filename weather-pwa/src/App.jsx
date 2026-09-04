import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Forecast from './pages/Forecast'

export default function App() {
  return (
    <BrowserRouter>
      <div className="pb-16">  {/* padding bottom để không bị BottomNav che */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/forecast" element={<Forecast />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  )
}