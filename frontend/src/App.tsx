import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import HomePage from './pages/HomePage'
import AssessmentPage from './pages/AssessmentPage'
import ResultsPage from './pages/ResultsPage'
import WhatIfPage from './pages/WhatIfPage'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/"           element={<HomePage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/results"    element={<ResultsPage />} />
        <Route path="/whatif"     element={<WhatIfPage />} />
      </Routes>
    </BrowserRouter>
  )
}
