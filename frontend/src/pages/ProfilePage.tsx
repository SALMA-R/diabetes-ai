import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, Mail, Calendar, Activity, TrendingUp,
  LogOut, Edit2, Key, Trash2, History,
} from 'lucide-react'
import { getUser, getUserStats, logout, deleteAccount } from '../services/auth'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = getUser()

  const [stats, setStats] = useState<{ total_evaluations: number; avg_risk_score: number } | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    getUserStats().then(setStats).catch(() => {})
  }, [])

  if (!user) return null

  const avgRisk = stats?.avg_risk_score ?? 0
  const riskInfo =
    avgRisk < 0.3 ? { label: 'Normal',  color: 'text-[#007A4D]', bg: 'bg-[#F0FFF8] border-[#00A86B]/20' }
    : avgRisk < 0.6 ? { label: 'Modéré', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' }
    : { label: 'Élevé', color: 'text-red-600', bg: 'bg-red-50 border-red-200' }

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('Déconnecté avec succès')
  }

  const handleDelete = async () => {
    if (!window.confirm(
      'Supprimer définitivement votre compte et toutes vos évaluations ? Cette action est irréversible.'
    )) return
    setDeleting(true)
    try {
      await deleteAccount()
      toast.success('Compte supprimé.')
      navigate('/')
    } catch {
      toast.error('Erreur lors de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100"
        style={{ boxShadow: '0 2px 12px rgba(0,168,107,0.08)' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#00A86B] rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-[#1E293B] text-lg tracking-tight">DiabetesAI</span>
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-red-500 font-medium transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Profile card */}
        <div className="bg-white rounded-2xl p-8"
          style={{ boxShadow: '0 4px 20px rgba(0,168,107,0.08)' }}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00A86B, #007A4D)' }}>
              {user.prenom[0].toUpperCase()}{user.nom[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#1E293B]">{user.prenom} {user.nom}</h1>
              <div className="flex items-center gap-2 text-[#64748B] mt-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[#64748B] mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-sm">
                  Membre depuis{' '}
                  {new Date(user.created_at).toLocaleDateString('fr-FR', {
                    month: 'long', year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              icon: <Activity className="w-5 h-5 text-[#00A86B]" />,
              bg: 'bg-[#F0FFF8]',
              value: stats?.total_evaluations ?? '—',
              label: 'Évaluations effectuées',
              valueColor: 'text-[#1E293B]',
            },
            {
              icon: <TrendingUp className="w-5 h-5 text-[#00A86B]" />,
              bg: 'bg-[#F0FFF8]',
              value: stats ? `${Math.round(avgRisk * 100)}%` : '—',
              label: `Risque moyen · ${riskInfo.label}`,
              valueColor: riskInfo.color,
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-6"
              style={{ boxShadow: '0 4px 20px rgba(0,168,107,0.08)' }}>
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                {s.icon}
              </div>
              <div className={`text-3xl font-extrabold ${s.valueColor}`}>{s.value}</div>
              <div className="text-sm text-[#64748B] font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl p-6 space-y-3"
          style={{ boxShadow: '0 4px 20px rgba(0,168,107,0.08)' }}>
          <h2 className="font-bold text-[#1E293B] mb-4">Actions</h2>

          <button onClick={() => navigate('/assessment')}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-white font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #00A86B, #007A4D)', boxShadow: '0 4px 12px rgba(0,168,107,0.25)' }}>
            <Activity className="w-5 h-5" /> Nouvelle évaluation
          </button>

          <button onClick={() => navigate('/history')}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 border-gray-200 text-[#1E293B] font-semibold hover:border-[#00A86B]/30 hover:bg-[#F0FFF8] transition-all duration-200">
            <History className="w-5 h-5 text-[#64748B]" /> Voir mon historique
          </button>

          <button onClick={() => toast('Fonctionnalité à venir', { icon: '✏️' })}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 border-gray-200 text-[#1E293B] font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
            <Edit2 className="w-5 h-5 text-[#64748B]" /> Modifier mon profil
          </button>

          <button onClick={() => toast('Fonctionnalité à venir', { icon: '🔑' })}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 border-gray-200 text-[#1E293B] font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
            <Key className="w-5 h-5 text-[#64748B]" /> Changer mon mot de passe
          </button>

          <button onClick={handleDelete} disabled={deleting}
            className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 border-red-200 text-red-500 font-semibold hover:border-red-300 hover:bg-red-50 transition-all duration-200 disabled:opacity-60">
            <Trash2 className="w-5 h-5" />
            {deleting ? 'Suppression…' : 'Supprimer mon compte'}
          </button>
        </div>
      </div>
    </div>
  )
}
