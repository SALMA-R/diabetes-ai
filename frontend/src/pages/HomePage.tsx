import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Users, TrendingUp, Activity,
  Heart, ChevronDown, LogOut, User, History,
} from 'lucide-react'
import { isAuthenticated, getUser, logout } from '../services/auth'

// ── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    let raf: number
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target, duration])
  return value
}

// ── Data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    emoji: '🧠', color: 'bg-green-50',
    title: 'Prédiction XGBoost',
    desc: 'Modèle entraîné sur 253 680 patients réels. AUC-ROC de 0.88.',
  },
  {
    emoji: '🔍', color: 'bg-blue-50',
    title: 'Explicabilité SHAP',
    desc: 'Comprendre exactement pourquoi le modèle prédit ce risque via les 3 facteurs clés.',
  },
  {
    emoji: '💊', color: 'bg-purple-50',
    title: 'Recommandations personnalisées',
    desc: '5 conseils adaptés à votre profil unique pour réduire votre risque.',
  },
  {
    emoji: '🔄', color: 'bg-orange-50',
    title: 'Simulation What-If',
    desc: "Testez l'impact de vos changements d'habitudes sur votre risque en temps réel.",
  },
  {
    emoji: '💬', color: 'bg-pink-50',
    title: 'Chatbot Médical IA',
    desc: 'Posez vos questions médicales à notre agent LLaMA-3.1 en français.',
  },
  {
    emoji: '📊', color: 'bg-teal-50',
    title: 'Dashboard de Suivi',
    desc: "Suivez l'évolution de votre risque dans le temps avec des graphiques clairs.",
  },
]

const STEPS = [
  {
    n: '1',
    title: 'Remplissez le questionnaire',
    sub: '5 minutes · 21 questions sur vos habitudes',
  },
  {
    n: '2',
    title: "L'IA analyse votre profil",
    sub: "XGBoost + SHAP en moins d'1 seconde",
  },
  {
    n: '3',
    title: 'Recevez vos résultats',
    sub: 'Score de risque + recommandations personnalisées',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate  = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef   = useRef<HTMLDivElement>(null)
  const statsRef  = useRef<HTMLDivElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)

  const authed = isAuthenticated()
  const user   = getUser()

  // Count-up values (start when section enters viewport)
  const count1 = useCountUp(253680, 2000, statsVisible)
  const count2 = useCountUp(88,     1400, statsVisible)
  const count3 = useCountUp(21,     1000, statsVisible)

  // IntersectionObserver for stats section
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-100"
        style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#00A86B] rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-[#1E293B] text-lg tracking-tight">DiabetesAI</span>
          </button>

          {/* Auth zone */}
          {authed && user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(v => !v)}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #00A86B, #007A4D)' }}>
                  {user.prenom[0].toUpperCase()}{user.nom[0].toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-[#1E293B] hidden sm:block">
                  {user.prenom}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl border border-gray-100 py-2 z-50"
                  style={{ boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}>
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-semibold text-[#1E293B]">{user.prenom} {user.nom}</p>
                    <p className="text-xs text-[#64748B] truncate">{user.email}</p>
                  </div>
                  {[
                    { icon: <User    className="w-4 h-4" />, label: 'Mon profil',  path: '/profile' },
                    { icon: <History className="w-4 h-4" />, label: 'Historique', path: '/history' },
                  ].map(({ icon, label, path }) => (
                    <button key={path} onClick={() => { navigate(path); setMenuOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1E293B] hover:bg-[#F8FAFC] transition-colors font-medium">
                      <span className="text-[#64748B]">{icon}</span>{label}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/auth')}
                className="text-sm font-semibold text-[#1E293B] hover:text-[#00A86B] transition-colors px-2">
                Connexion
              </button>
              <button onClick={() => navigate('/auth')}
                className="bg-[#00A86B] hover:bg-[#007A4D] text-white text-sm font-semibold px-5 py-2.5
                  rounded-full transition-all duration-200 hover:scale-105 shadow-sm">
                S'inscrire
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #F0FFF8 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 bg-white border border-green-200 text-green-700
            text-xs font-medium px-4 py-1.5 rounded-full shadow-sm mb-8">
            <span>🧬</span>
            <span>Powered by XGBoost &amp; SHAP</span>
          </div>

          {/* H1 */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#1E293B] leading-[1.1] mb-6 tracking-tight">
            Évaluez votre risque de
            <br />
            <span style={{ color: '#00A86B', fontStyle: 'italic' }}>diabète</span>
            <br />
            en 2 minutes
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Un questionnaire de 21 indicateurs analysé par intelligence artificielle
            avec explications SHAP et recommandations personnalisées.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button onClick={() => navigate('/assessment')}
              className="inline-flex items-center justify-center gap-2 bg-[#00A86B] hover:bg-[#007A4D]
                text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg
                hover:scale-105 transition-all duration-200 active:scale-95">
              Commencer l'évaluation <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 border-2 border-[#00A86B]
                text-[#00A86B] px-8 py-4 rounded-full font-semibold text-lg
                hover:bg-green-50 transition-all duration-200">
              En savoir plus
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            {['✓ Gratuit', '✓ Anonyme', '✓ Résultat immédiat'].map(b => (
              <span key={b} className="font-medium">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════════════════ */}
      <section ref={statsRef} className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-gray-100">
          {[
            {
              icon : <Users      className="w-6 h-6 text-[#00A86B]" />,
              value: count1.toLocaleString('fr-FR'),
              label: 'patients analysés',
            },
            {
              icon : <TrendingUp className="w-6 h-6 text-[#00A86B]" />,
              value: `AUC-ROC ${count2}%`,
              label: 'précision du modèle',
            },
            {
              icon : <Activity   className="w-6 h-6 text-[#00A86B]" />,
              value: count3,
              label: 'indicateurs de santé',
            },
          ].map(({ icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-3 text-center px-8">
              <div className="w-12 h-12 bg-[#F0FFF8] rounded-2xl flex items-center justify-center">
                {icon}
              </div>
              <div className="text-3xl font-extrabold text-[#1E293B] tabular-nums">{value}</div>
              <div className="text-sm text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
      <section id="features" className="bg-[#F8FAFC] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-[#1E293B] mb-3">
              Ce que DiabetesAI fait pour vous
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Une approche complète alliant IA et médecine préventive
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1
                  transition-all duration-300 cursor-default border border-gray-50">
                <div className={`inline-flex items-center justify-center ${f.color} rounded-xl p-3 mb-4`}>
                  <span className="text-2xl leading-none">{f.emoji}</span>
                </div>
                <h3 className="text-base font-bold text-[#1E293B] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-[#1E293B]">Comment ça marche ?</h2>
          </div>

          <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-0">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex md:flex-col md:items-center md:text-center md:flex-1">

                {/* Step content */}
                <div className="flex md:flex-col md:items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#00A86B] text-white font-extrabold text-xl
                    flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: '0 4px 14px rgba(0,168,107,0.35)' }}>
                    {s.n}
                  </div>
                  <div className="md:mt-4 md:px-4">
                    <p className="font-bold text-[#1E293B] text-base">{s.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{s.sub}</p>
                  </div>
                </div>

                {/* Arrow between steps — desktop only */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute" style={{ display: 'none' }} />
                )}
              </div>
            ))}
          </div>

          {/* Desktop arrows overlay */}
          <div className="hidden md:flex justify-around mt-[-60px] mb-4 pointer-events-none select-none px-24">
            <ArrowRight className="w-7 h-7 text-gray-200" />
            <ArrowRight className="w-7 h-7 text-gray-200" />
          </div>
        </div>
      </section>

      {/* ══ CTA ═════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #00A86B 0%, #007A4D 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Prêt à connaître votre risque ?
          </h2>
          <p className="text-white/75 text-lg mb-10 leading-relaxed">
            Le questionnaire prend moins de 2 minutes.<br />
            Aucune donnée personnelle n'est conservée.
          </p>
          <button onClick={() => navigate('/assessment')}
            className="inline-flex items-center gap-3 bg-white text-[#007A4D] font-bold
              px-10 py-4 rounded-full text-lg hover:scale-105 transition-all duration-200
              active:scale-95 shadow-xl">
            Commencer l'évaluation <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="bg-[#1E293B] py-10 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 bg-[#00A86B] rounded-lg flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-white font-bold tracking-tight">DiabetesAI</span>
          </div>
          <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
            ⚕️ Les résultats fournis par DiabetesAI sont à titre informatif uniquement
            et ne remplacent en aucun cas un avis médical professionnel.
            Consultez un médecin pour tout diagnostic.
          </p>
        </div>
      </footer>

    </div>
  )
}
