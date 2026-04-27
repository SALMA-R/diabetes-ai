import { useNavigate } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import { Activity, ArrowLeft, CalendarDays, PlusCircle, TrendingUp } from 'lucide-react'
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

// ── Health score axes ─────────────────────────────────────────────────────────
function computeRadar(p: PatientData) {
  // Each axis 0–100, higher = better
  const alimentation = Math.round(
    ((p.Fruits + p.Veggies) / 2) * 50 +
    (p.HvyAlcoholConsump === 0 ? 30 : 0) +
    (p.Smoker === 0 ? 20 : 0)
  )
  const activite = p.PhysActivity === 1 ? 90 : 30
  const imc = (() => {
    if (p.BMI < 18.5) return 60
    if (p.BMI < 25)   return 100
    if (p.BMI < 30)   return 65
    if (p.BMI < 35)   return 40
    return 20
  })()
  const bienetre = Math.round(
    100 -
    (p.HighBP   === 1 ? 25 : 0) -
    (p.HighChol === 1 ? 20 : 0) -
    (p.DiffWalk === 1 ? 15 : 0) -
    Math.min((p.MentHlth / 30) * 20, 20) -
    Math.min((p.PhysHlth / 30) * 20, 20)
  )
  return [
    { axis: 'Alimentation', value: Math.max(0, Math.min(100, alimentation)) },
    { axis: 'Activité',     value: Math.max(0, Math.min(100, activite))     },
    { axis: 'IMC',          value: Math.max(0, Math.min(100, imc))          },
    { axis: 'Bien-être',    value: Math.max(0, Math.min(100, bienetre))     },
  ]
}

function globalScore(axes: { value: number }[]) {
  return Math.round(axes.reduce((s, a) => s + a.value, 0) / axes.length)
}

// ── Classification badge color ────────────────────────────────────────────────
const CLASS_COLOR: Record<string, string> = {
  Normal: 'bg-green-100 text-green-700',
  'Pre-diabetique': 'bg-amber-100 text-amber-700',
  Diabetique: 'bg-red-100 text-red-700',
}

// ── Format history for chart ──────────────────────────────────────────────────
function buildChartData(history: RiskEntry[]) {
  if (history.length === 0) return []
  return history.map(e => ({
    date: new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    risque: Math.round(e.score * 100),
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const patient  = loadPatient()
  const score    = loadScore()
  const history  = loadHistory()

  const radarData   = patient ? computeRadar(patient) : []
  const global      = radarData.length ? globalScore(radarData) : null
  const chartData   = buildChartData(history)
  const lastEntry   = history.length ? history[history.length - 1] : null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/results')}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Mon tableau de bord santé</h1>
        </div>

        {/* ── Global health score + Radar ── */}
        {patient ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-base font-bold text-gray-700 mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Score de santé global
            </h2>
            <p className="text-xs text-gray-400 mb-6">Basé sur vos habitudes de vie</p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Big score */}
              <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full
                border-4 border-blue-400 bg-blue-50 flex-shrink-0">
                <span className="text-3xl font-extrabold text-blue-600">{global}</span>
                <span className="text-xs text-blue-400 font-medium">/100</span>
              </div>

              {/* Radar */}
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25}
                    strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Axis scores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {radarData.map(a => (
                <div key={a.axis} className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">{a.axis}</p>
                  <p className="text-lg font-bold text-gray-700">{a.value}<span className="text-xs text-gray-400">/100</span></p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full bg-blue-400"
                      style={{ width: `${a.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
            Aucune donnée patient. Faites d'abord une évaluation.
          </div>
        )}

        {/* ── Risk history chart ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-base font-bold text-gray-700 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Évolution du risque
          </h2>
          <p className="text-xs text-gray-400 mb-6">Historique de vos évaluations</p>

          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Risque']} />
                <ReferenceLine y={30} stroke="#16a34a" strokeDasharray="4 4" label={{ value: '30%', fill: '#16a34a', fontSize: 10 }} />
                <ReferenceLine y={60} stroke="#dc2626" strokeDasharray="4 4" label={{ value: '60%', fill: '#dc2626', fontSize: 10 }} />
                <Line type="monotone" dataKey="risque" stroke="#3b82f6"
                  strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : chartData.length === 1 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Une seule évaluation enregistrée ({chartData[0].risque}%). Faites une nouvelle évaluation pour voir l'évolution.
            </p>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              Aucune évaluation enregistrée. Commencez par faire une évaluation.
            </p>
          )}
        </div>

        {/* ── Last evaluation summary ── */}
        {lastEntry && score !== null && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              Dernière évaluation
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Date</p>
                <p className="font-semibold text-gray-700 text-sm">
                  {new Date(lastEntry.date).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Score de risque</p>
                <p className="font-extrabold text-2xl text-gray-800">
                  {Math.round(score * 100)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Classification</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                  ${CLASS_COLOR[lastEntry.classification] ?? 'bg-gray-100 text-gray-600'}`}>
                  {lastEntry.classification === 'Pre-diabetique' ? 'Pré-diabétique' : lastEntry.classification}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <button
          onClick={() => navigate('/assessment')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
            bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Nouvelle évaluation
        </button>

      </div>
    </div>
  )
}
