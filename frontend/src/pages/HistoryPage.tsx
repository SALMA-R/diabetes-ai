import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ArrowLeft, CalendarDays, TrendingUp, Activity, ChevronRight, Inbox } from 'lucide-react'
import { getHistory } from '../services/auth'

interface HistoryEntry {
  id: number
  risk_score: number
  classification: string
  patient_data: Record<string, unknown>
  created_at: string
}

const CLASS_STYLE: Record<string, { pill: string; dot: string }> = {
  Normal:           { pill: 'bg-[#F0FFF8] text-[#007A4D] border-[#00A86B]/20',   dot: 'bg-[#00A86B]'  },
  'Pre-diabetique': { pill: 'bg-amber-50 text-amber-700 border-amber-200',         dot: 'bg-amber-400'  },
  Diabetique:       { pill: 'bg-red-50 text-red-600 border-red-200',               dot: 'bg-red-500'    },
}

function riskColor(score: number) {
  if (score < 0.3) return '#00A86B'
  if (score < 0.6) return '#F59E0B'
  return '#EF4444'
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    getHistory()
      .then(data => setHistory(data as HistoryEntry[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100"
        style={{ boxShadow: '0 2px 12px rgba(0,168,107,0.08)' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate('/profile')}
            className="text-[#64748B] hover:text-[#1E293B] transition-colors p-1 rounded-lg hover:bg-[#F8FAFC]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-[#00A86B] rounded-xl flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <h1 className="text-lg font-bold text-[#1E293B]">Historique des évaluations</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

        {/* Summary bar */}
        {!loading && sorted.length > 0 && (
          <div className="bg-white rounded-2xl px-6 py-4 flex items-center gap-6"
            style={{ boxShadow: '0 4px 20px rgba(0,168,107,0.08)' }}>
            <div className="flex items-center gap-2 text-[#64748B]">
              <Activity className="w-4 h-4 text-[#00A86B]" />
              <span className="text-sm font-semibold text-[#1E293B]">{sorted.length}</span>
              <span className="text-sm">évaluation{sorted.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 text-[#64748B]">
              <TrendingUp className="w-4 h-4 text-[#00A86B]" />
              <span className="text-sm">Risque moyen :</span>
              <span className="text-sm font-semibold text-[#1E293B]">
                {Math.round((sorted.reduce((s, e) => s + e.risk_score, 0) / sorted.length) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-3 border-[#00A86B] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && sorted.length === 0 && (
          <div className="bg-white rounded-2xl p-16 flex flex-col items-center gap-4 text-center"
            style={{ boxShadow: '0 4px 20px rgba(0,168,107,0.08)' }}>
            <div className="w-16 h-16 bg-[#F0FFF8] rounded-2xl flex items-center justify-center">
              <Inbox className="w-8 h-8 text-[#00A86B]" />
            </div>
            <p className="text-[#1E293B] font-bold text-lg">Aucune évaluation</p>
            <p className="text-[#64748B] text-sm max-w-xs">
              Vos évaluations enregistrées apparaîtront ici. Commencez par faire votre première analyse.
            </p>
            <button onClick={() => navigate('/assessment')}
              className="mt-2 bg-[#00A86B] hover:bg-[#007A4D] text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              style={{ boxShadow: '0 4px 12px rgba(0,168,107,0.25)' }}>
              Faire une évaluation
            </button>
          </div>
        )}

        {/* History list */}
        {sorted.map((entry, idx) => {
          const cs = CLASS_STYLE[entry.classification] ?? CLASS_STYLE['Normal']
          const rc = riskColor(entry.risk_score)
          const isOpen = expanded === entry.id
          const date = new Date(entry.created_at)

          return (
            <div key={entry.id}
              className="bg-white rounded-2xl overflow-hidden transition-all duration-200"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

              {/* Row */}
              <button
                className="w-full flex items-center gap-4 px-6 py-5 hover:bg-[#F8FAFC] transition-colors text-left"
                onClick={() => setExpanded(isOpen ? null : entry.id)}>

                {/* Index */}
                <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#64748B]">#{sorted.length - idx}</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-[#64748B] min-w-[110px]">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Risk score */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-2 flex-1 max-w-[120px] bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(entry.risk_score * 100)}%`, backgroundColor: rc }} />
                  </div>
                  <span className="text-sm font-extrabold" style={{ color: rc }}>
                    {Math.round(entry.risk_score * 100)}%
                  </span>
                </div>

                {/* Classification */}
                <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cs.pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cs.dot}`} />
                  {entry.classification === 'Pre-diabetique' ? 'Pré-diabétique' : entry.classification}
                </span>

                <ChevronRight className={`w-4 h-4 text-[#94A3B8] flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-6 pb-5 border-t border-gray-50">
                  <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Heure',        value: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
                      { label: 'Risque',        value: `${Math.round(entry.risk_score * 100)}%` },
                      { label: 'IMC',           value: entry.patient_data?.BMI != null ? String(entry.patient_data.BMI) : '—' },
                      { label: 'Âge (tranche)', value: entry.patient_data?.Age != null ? String(entry.patient_data.Age) : '—' },
                      { label: 'TA élevée',     value: entry.patient_data?.HighBP === 1 ? 'Oui' : 'Non' },
                      { label: 'Cholestérol',   value: entry.patient_data?.HighChol === 1 ? 'Élevé' : 'Normal' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#F8FAFC] rounded-xl px-4 py-3">
                        <p className="text-xs text-[#64748B] font-medium mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-[#1E293B]">{value}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/assessment')}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[#00A86B] border-2 border-[#00A86B]/30 font-semibold text-sm hover:bg-[#F0FFF8] transition-all duration-200">
                    Refaire une évaluation similaire
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
