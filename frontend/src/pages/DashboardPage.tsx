import { useNavigate } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { Activity, ArrowLeft, CalendarDays, PlusCircle, TrendingUp, Heart } from 'lucide-react'
import type { PatientData } from '../services/api'

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadPatient(): PatientData | null {
  try {
    const raw = localStorage.getItem('lastPatientData')
    return raw ? (JSON.parse(raw) as PatientData) : null
  } catch { return null }
}
function loadScore(): number | null {
  const raw = localStorage.getItem('lastRiskScore')
  return raw ? parseFloat(raw) : null
}
export interface RiskEntry { date: string; score: number; classification: string }
function loadHistory(): RiskEntry[] {
  try {
    const raw = localStorage.getItem('riskHistory')
    return raw ? (JSON.parse(raw) as RiskEntry[]) : []
  } catch { return [] }
}

// ── Health score axes (updated to use new lifestyle fields) ───────────────────
function computeRadar(p: PatientData) {
  // Alimentation (0–100)
  const fruitsVeg = ((p.Fruits + p.Veggies) / 2) * 40
  const noAddictions = (p.HvyAlcoholConsump === 0 ? 20 : 0) + (p.Smoker === 0 ? 15 : 0)
  const mealBonus  = Math.round(((p.homemade_meals_week ?? 14) / 21) * 13)
  const waterBonus = Math.min(Math.round(((p.water_glasses ?? 6) / 8) * 12), 12)
  const alimentation = Math.min(100, Math.round(fruitsVeg + noAddictions + mealBonus + waterBonus))

  // Activité (0–100)
  const actBase = p.PhysActivity === 1 ? 65 : 20
  const sed = p.sedentary_hours ?? 6
  const sedBonus = Math.round(Math.max(0, 35 * (1 - sed / 12)))
  const activite = Math.min(100, actBase + sedBonus)

  // IMC (0–100)
  const imc = (() => {
    if (p.BMI < 18.5) return 60
    if (p.BMI < 25)   return 100
    if (p.BMI < 30)   return 65
    if (p.BMI < 35)   return 40
    return 20
  })()

  // Bien-être (0–100) — enrichi avec sommeil + stress + relaxation
  const bienBase = Math.round(
    100
    - (p.HighBP   === 1 ? 20 : 0)
    - (p.HighChol === 1 ? 15 : 0)
    - (p.DiffWalk === 1 ? 10 : 0)
    - Math.min((p.MentHlth / 30) * 15, 15)
    - Math.min((p.PhysHlth / 30) * 15, 15)
  )
  const sleep = p.sleep_hours ?? 7
  const sleepMod = sleep >= 7 && sleep <= 9 ? 0 : sleep >= 6 ? -5 : -15
  const stress = p.stress_level ?? 2
  const stressMod = -((stress - 1) * 3)                          // stress 1→0, stress 5→−12
  const relaxMod = (p.relaxation_practice ?? 0) === 1 ? 8 : 0
  const sleepDis = (p.sleep_disorders   ?? 0) === 1 ? -10 : 0
  const bienetre = Math.max(0, Math.min(100, bienBase + sleepMod + stressMod + relaxMod + sleepDis))

  return [
    { axis: 'Alimentation', value: Math.max(0, alimentation) },
    { axis: 'Activité',     value: Math.max(0, activite)     },
    { axis: 'IMC',          value: Math.max(0, imc)          },
    { axis: 'Bien-être',    value: Math.max(0, bienetre)     },
  ]
}

function globalScore(axes: { value: number }[]) {
  return Math.round(axes.reduce((s, a) => s + a.value, 0) / axes.length)
}

const CLASS_COLOR: Record<string, string> = {
  Normal          : 'bg-[#F0FFF8] text-[#007A4D]',
  'Pre-diabetique': 'bg-amber-100 text-amber-700',
  Diabetique      : 'bg-red-100 text-red-700',
}

function buildChartData(history: RiskEntry[]) {
  if (!history.length) return []
  return history.map(e => ({
    date   : new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    risque : Math.round(e.score * 100),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const patient  = loadPatient()
  const score    = loadScore()
  const history  = loadHistory()

  const radarData = patient ? computeRadar(patient) : []
  const global    = radarData.length ? globalScore(radarData) : null
  const chartData = buildChartData(history)
  const lastEntry = history.length ? history[history.length - 1] : null

  const globalColor = global === null ? '#64748B'
    : global >= 70 ? '#00A86B' : global >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100"
        style={{ boxShadow: '0 2px 12px rgba(0,168,107,0.08)' }}>
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate('/results')}
            className="text-[#64748B] hover:text-[#1E293B] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-[#00A86B] rounded-xl flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <h1 className="text-lg font-bold text-[#1E293B]">Tableau de bord santé</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Global health score + Radar ── */}
        {patient ? (
          <div className="bg-white rounded-2xl p-8"
            style={{ boxShadow: '0 4px 20px rgba(0,168,107,0.08)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-[#00A86B]" />
              <h2 className="text-base font-bold text-[#1E293B]">Score de santé global</h2>
            </div>
            <p className="text-xs text-[#64748B] mb-6">Basé sur vos habitudes de vie et votre profil</p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Big score */}
              <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full flex-shrink-0 border-4"
                style={{
                  borderColor: globalColor,
                  backgroundColor: global !== null && global >= 70 ? '#F0FFF8' : global !== null && global >= 40 ? '#FFFBEB' : '#FEF2F2',
                  boxShadow: `0 0 0 6px ${globalColor}1A`,
                }}>
                <span className="text-3xl font-extrabold" style={{ color: globalColor }}>{global}</span>
                <span className="text-xs text-[#64748B] font-medium">/100</span>
              </div>

              {/* Radar */}
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#00A86B" fill="#00A86B" fillOpacity={0.20} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Axis scores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {radarData.map(a => {
                const c = a.value >= 70 ? '#00A86B' : a.value >= 40 ? '#F59E0B' : '#EF4444'
                return (
                  <div key={a.axis} className="text-center p-3 bg-[#F8FAFC] rounded-xl border border-gray-100">
                    <p className="text-xs text-[#64748B] mb-1">{a.axis}</p>
                    <p className="text-lg font-extrabold" style={{ color: c }}>
                      {a.value}<span className="text-xs text-[#64748B] font-normal">/100</span>
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${a.value}%`, backgroundColor: c }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center text-[#64748B]"
            style={{ boxShadow: '0 4px 20px rgba(0,168,107,0.08)' }}>
            Aucune donnée patient. Faites d'abord une évaluation.
          </div>
        )}

        {/* ── Risk history chart ── */}
        <div className="bg-white rounded-2xl p-8"
          style={{ boxShadow: '0 4px 20px rgba(0,168,107,0.08)' }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#00A86B]" />
            <h2 className="text-base font-bold text-[#1E293B]">Évolution du risque</h2>
          </div>
          <p className="text-xs text-[#64748B] mb-6">Historique de vos évaluations</p>

          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, 'Risque']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <ReferenceLine y={30} stroke="#00A86B" strokeDasharray="4 4"
                  label={{ value: '30%', fill: '#00A86B', fontSize: 10 }} />
                <ReferenceLine y={60} stroke="#EF4444" strokeDasharray="4 4"
                  label={{ value: '60%', fill: '#EF4444', fontSize: 10 }} />
                <Line type="monotone" dataKey="risque" stroke="#00A86B"
                  strokeWidth={2.5} dot={{ r: 4, fill: '#00A86B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : chartData.length === 1 ? (
            <p className="text-sm text-[#64748B] text-center py-8">
              Une seule évaluation enregistrée ({chartData[0].risque}%).<br />
              Faites une nouvelle évaluation pour voir l'évolution.
            </p>
          ) : (
            <p className="text-sm text-[#64748B] text-center py-8">
              Aucune évaluation enregistrée. Commencez par faire une évaluation.
            </p>
          )}
        </div>

        {/* ── Last evaluation summary ── */}
        {lastEntry && score !== null && (
          <div className="bg-white rounded-2xl p-8"
            style={{ boxShadow: '0 4px 20px rgba(0,168,107,0.08)' }}>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-[#00A86B]" />
              <h2 className="text-base font-bold text-[#1E293B]">Dernière évaluation</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-[#64748B] font-medium">Date</p>
                <p className="font-semibold text-[#1E293B] text-sm">
                  {new Date(lastEntry.date).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#64748B] font-medium">Score de risque</p>
                <p className="font-extrabold text-2xl text-[#1E293B]">
                  {Math.round(score * 100)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-[#64748B] font-medium">Classification</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                  ${CLASS_COLOR[lastEntry.classification] ?? 'bg-gray-100 text-gray-600'}`}>
                  {lastEntry.classification === 'Pre-diabetique' ? 'Pré-diabétique' : lastEntry.classification}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <button onClick={() => navigate('/assessment')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00A86B 0%, #007A4D 100%)', boxShadow: '0 4px 16px rgba(0,168,107,0.25)' }}>
          <PlusCircle className="w-5 h-5" /> Nouvelle évaluation
        </button>

      </div>
    </div>
  )
}
