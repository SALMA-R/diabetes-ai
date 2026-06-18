import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import HomePage      from './pages/HomePage'
import AssessmentPage from './pages/AssessmentPage'
import ResultsPage   from './pages/ResultsPage'
import WhatIfPage    from './pages/WhatIfPage'
import ChatbotPage   from './pages/ChatbotPage'
import DashboardPage from './pages/DashboardPage'
import AuthPage            from './pages/AuthPage'
import GoogleCallbackPage  from './pages/GoogleCallbackPage'
import ProfilePage         from './pages/ProfilePage'
import HistoryPage         from './pages/HistoryPage'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Inter, sans-serif', borderRadius: '12px', fontSize: '14px' },
        success: { style: { border: '1px solid #00A86B', color: '#007A4D' } },
      }} />
      <Routes>
        {/* Public routes */}
        <Route path="/"           element={<HomePage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/results"    element={<ResultsPage />} />
        <Route path="/whatif"     element={<WhatIfPage />} />
        <Route path="/chat"       element={<ChatbotPage />} />
        <Route path="/dashboard"  element={<DashboardPage />} />
        <Route path="/auth"          element={<AuthPage />} />
        <Route path="/auth/callback" element={<GoogleCallbackPage />} />

        {/* Protected routes */}
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><HistoryPage /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
