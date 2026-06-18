import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Eye, EyeOff, Mail, Lock, CheckCircle2, Loader2 } from 'lucide-react'
import { login, register } from '../services/auth'
import toast from 'react-hot-toast'

// ── Google OAuth button ───────────────────────────────────────────────────────
function GoogleButton() {
  return (
    <button
      type="button"
      onClick={() => { window.location.href = 'http://localhost:8000/auth/google' }}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2
        border-gray-200 bg-white hover:border-[#00A86B]/40 hover:bg-[#F0FFF8]
        transition-all duration-200 font-semibold text-sm text-[#1E293B] group">
      {/* Logo Google SVG officiel */}
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
      </svg>
      Se connecter avec Google
    </button>
  )
}

// ── Password strength ─────────────────────────────────────────────────────────
function pwdStrength(p: string): { level: number; label: string; color: string } {
  if (!p)          return { level: 0, label: '',            color: '' }
  if (p.length < 6) return { level: 1, label: 'Trop court',  color: 'bg-red-400' }
  const hasUp  = /[A-Z]/.test(p)
  const hasNum = /[0-9]/.test(p)
  const hasSym = /[^a-zA-Z0-9]/.test(p)
  const extra  = (hasUp ? 1 : 0) + (hasNum ? 1 : 0) + (hasSym ? 1 : 0)
  if (extra >= 2 && p.length >= 10) return { level: 5, label: 'Fort',   color: 'bg-[#00A86B]' }
  if (extra >= 1 && p.length >= 8)  return { level: 3, label: 'Moyen',  color: 'bg-yellow-400' }
  return { level: 2, label: 'Faible', color: 'bg-orange-400' }
}

// ── Reusable input wrapper ────────────────────────────────────────────────────
function InputField({
  label, type, value, onChange, placeholder, icon, rightEl,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void
  placeholder?: string; icon?: React.ReactNode; rightEl?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-[#1E293B]">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border-2 border-gray-200 rounded-xl py-3 focus:outline-none focus:border-[#00A86B] transition-colors text-[#1E293B] placeholder-gray-300
            ${icon ? 'pl-10' : 'pl-4'} ${rightEl ? 'pr-10' : 'pr-4'}`}
        />
        {rightEl && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate()
  const [tab, setTab]         = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  // Login state
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register state
  const [regPrenom, setRegPrenom]   = useState('')
  const [regNom, setRegNom]         = useState('')
  const [regEmail, setRegEmail]     = useState('')
  const [regPwd, setRegPwd]         = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const strength = pwdStrength(regPwd)
  const eyeBtn   = (
    <button type="button" onClick={() => setShowPwd(v => !v)}
      className="text-[#64748B] hover:text-[#1E293B] transition-colors">
      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) { toast.error('Remplissez tous les champs.'); return }
    setLoading(true)
    try {
      await login(loginEmail, loginPassword)
      toast.success('Bienvenue !')
      navigate('/')
    } catch { /* error handled in auth.ts */ } finally { setLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regPrenom || !regNom || !regEmail || !regPwd) { toast.error('Remplissez tous les champs.'); return }
    if (regPwd !== regConfirm) { toast.error('Les mots de passe ne correspondent pas.'); return }
    if (regPwd.length < 6) { toast.error('Mot de passe trop court (6 caractères min).'); return }
    setLoading(true)
    try {
      await register(regEmail, regPwd, regNom, regPrenom)
      toast.success('Compte créé avec succès !')
      navigate('/')
    } catch { /* error handled in auth.ts */ } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F0FFF8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')}
            className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-[#00A86B] rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-[#1E293B] text-2xl tracking-tight">DiabetesAI</span>
          </button>
          <p className="text-[#64748B] text-sm mt-2">
            {tab === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte gratuit'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8"
          style={{ boxShadow: '0 20px 60px rgba(0,168,107,0.10), 0 4px 16px rgba(0,0,0,0.06)' }}>

          {/* Tabs */}
          <div className="flex bg-[#F8FAFC] rounded-xl p-1 mb-8">
            {[
              { key: 'login',    label: 'Connexion'   },
              { key: 'register', label: 'Inscription'  },
            ].map(({ key, label }) => (
              <button key={key} type="button"
                onClick={() => setTab(key as 'login' | 'register')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
                  ${tab === key ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── Login form ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <InputField label="Email" type="email" value={loginEmail} onChange={setLoginEmail}
                placeholder="vous@exemple.com" icon={<Mail className="w-4 h-4" />} />
              <InputField label="Mot de passe" type={showPwd ? 'text' : 'password'}
                value={loginPassword} onChange={setLoginPassword}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                rightEl={eyeBtn} />
              <div className="flex justify-end -mt-2">
                <button type="button"
                  className="text-xs text-[#00A86B] hover:text-[#007A4D] font-semibold transition-colors">
                  Mot de passe oublié ?
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #00A86B 0%, #007A4D 100%)', boxShadow: '0 4px 16px rgba(0,168,107,0.25)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Connexion…</> : 'Se connecter'}
              </button>
              <p className="text-center text-sm text-[#64748B]">
                Pas encore de compte ?{' '}
                <button type="button" onClick={() => setTab('register')}
                  className="text-[#00A86B] font-semibold hover:text-[#007A4D]">
                  Créer un compte
                </button>
              </p>

              {/* ── Séparateur ── */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-[#94A3B8] font-medium">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* ── Bouton Google ── */}
              <GoogleButton />
            </form>
          )}

          {/* ── Register form ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1E293B]">Prénom</label>
                  <input type="text" value={regPrenom} onChange={e => setRegPrenom(e.target.value)}
                    placeholder="Jean"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00A86B] transition-colors text-[#1E293B] placeholder-gray-300" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#1E293B]">Nom</label>
                  <input type="text" value={regNom} onChange={e => setRegNom(e.target.value)}
                    placeholder="Dupont"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#00A86B] transition-colors text-[#1E293B] placeholder-gray-300" />
                </div>
              </div>

              <InputField label="Email" type="email" value={regEmail} onChange={setRegEmail}
                placeholder="vous@exemple.com" icon={<Mail className="w-4 h-4" />} />

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#1E293B]">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input type={showPwd ? 'text' : 'password'} value={regPwd}
                    onChange={e => setRegPwd(e.target.value)} placeholder="••••••••"
                    className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-[#00A86B] transition-colors text-[#1E293B] placeholder-gray-300" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B]">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regPwd && strength.level > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300
                            ${i <= strength.level ? strength.color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-[#64748B]">
                      Sécurité : <span className="font-semibold">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#1E293B]">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input type={showPwd ? 'text' : 'password'} value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)} placeholder="••••••••"
                    className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-[#00A86B] transition-colors text-[#1E293B] placeholder-gray-300" />
                  {regConfirm && regPwd === regConfirm && (
                    <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00A86B]" />
                  )}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #00A86B 0%, #007A4D 100%)', boxShadow: '0 4px 16px rgba(0,168,107,0.25)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Création…</> : 'Créer mon compte'}
              </button>

              <p className="text-center text-sm text-[#64748B]">
                Déjà un compte ?{' '}
                <button type="button" onClick={() => setTab('login')}
                  className="text-[#00A86B] font-semibold hover:text-[#007A4D]">
                  Se connecter
                </button>
              </p>

              {/* ── Séparateur ── */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-[#94A3B8] font-medium">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* ── Bouton Google ── */}
              <GoogleButton />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
