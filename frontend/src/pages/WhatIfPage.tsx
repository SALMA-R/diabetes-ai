import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { predictDiabetes, type PatientData } from '../services/api'
import toast from 'react-hot-toast'

// ─── mini gauge ───────────────────────────────────────────────────────────────
function MiniGauge({ score, label }: { score: number; label: string }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 80)
    return () => clearTimeout(t)
  }, [score])

  const pct   = animated * 100
  const r     = 44
  const circ  = 2 * Math.PI * r
  const color = pct < 30 ? '#16a34a' : pct < 60 ? '#ea580c' : '#dc2626'

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <div className="relative flex items-center justify-center">
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle cx="55" cy="55" r={r}
            fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (pct / 100) * circ}
            transform="rotate(-90 55 55)"
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center leading-tight">
          <span className="text-xl font-extrabold" style={{ color }}>
            {Math.round(pct)}%
          </span>
          <span className="text-[10px] text-gray-400">de risque</span>
        </div>
      </div>
    </div>
  )
}

// ─── toggle button ────────────────────────────────────────────────────────────
function Toggle({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex gap-2">
        {([1, 0] as const).map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all
              ${value === v
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'}`}
          >
            {v === 1 ? 'Oui' : 'Non'}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function WhatIfPage() {
  const navigate  = useNavigate()
  const loadingRef = useRef(false)

  // Read localStorage once synchronously so initial state is correct on first render
  const _saved = (() => {
    try {
      const rawPatient = localStorage.getItem('lastPatientData')
      const rawScore   = localStorage.getItem('lastRiskScore')
      if (!rawPatient || !rawScore) return null
      return {
        patientData: JSON.parse(rawPatient) as PatientData,
        riskScore: parseFloat(rawScore),
      }
    } catch { return null }
  })()

  const [baseScore]                     = useState<number | null>(_saved?.riskScore ?? null)
  const [basePatient]                   = useState<PatientData | null>(_saved?.patientData ?? null)
  const [simScore, setSimScore]         = useState<number | null>(null)
  const [simDone, setSimDone]           = useState(false)
  const [loading, setLoading]           = useState(false)

  // Editable habits — initialised from real patient values
  const [bmi, setBmi]                   = useState<number>(_saved?.patientData.BMI ?? 25)
  const [physActivity, setPhysActivity] = useState<number>(_saved?.patientData.PhysActivity ?? 1)
  const [fruits, setFruits]             = useState<number>(_saved?.patientData.Fruits ?? 1)
  const [veggies, setVeggies]           = useState<number>(_saved?.patientData.Veggies ?? 1)
  const [smoker, setSmoker]             = useState<number>(_saved?.patientData.Smoker ?? 0)
  const [alcohol, setAlcohol]           = useState<number>(_saved?.patientData.HvyAlcoholConsump ?? 0)

  useEffect(() => {
    if (!_saved) {
      toast.error('Données introuvables. Faites d\'abord une évaluation.')
    }
  }, [])

  const handleSimulate = async () => {
    if (loadingRef.current || !basePatient) return
    loadingRef.current = true
    setLoading(true)
    try {
      const payload: PatientData = {
        ...basePatient,
        BMI: bmi,
        PhysActivity: physActivity,
        Fruits: fruits,
        Veggies: veggies,
        Smoker: smoker,
        HvyAlcoholConsump: alcohol,
      }
      const result = await predictDiabetes(payload)
      setSimScore(result.risk_score)
      setSimDone(true)
    } catch {
      // toast already shown by api.ts
    } finally {
      setLoading(false)
      setTimeout(() => { loadingRef.current = false }, 500)
    }
  }

  const delta = simScore !== null && baseScore !== null
    ? Math.round((baseScore - simScore) * 100)
    : null

  const improved = delta !== null && delta > 0

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <button onClick={() => navigate('/results')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour aux résultats
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Simulez une amélioration de votre santé
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Modifiez vos habitudes et voyez l'impact sur votre risque diabétique en temps réel
          </p>
        </div>

        {/* Sliders & Toggles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            Modifiez vos habitudes
          </h2>

          {/* BMI slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">IMC (Indice de Masse Corporelle)</span>
              <span className="text-base font-bold text-orange-500">{bmi.toFixed(1)}</span>
            </div>
            <input
              type="range" min={15} max={45} step={0.5}
              value={bmi}
              onChange={e => setBmi(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>15 (très bas)</span>
              <span className="text-green-600 font-medium">18.5–24.9 normal</span>
              <span>45 (obésité)</span>
            </div>
          </div>

          {/* Toggles */}
          <div>
            <Toggle label="Activité physique régulière" value={physActivity} onChange={setPhysActivity} />
            <Toggle label="Consommation quotidienne de fruits" value={fruits} onChange={setFruits} />
            <Toggle label="Consommation quotidienne de légumes" value={veggies} onChange={setVeggies} />
            <Toggle label="Fumeur" value={smoker} onChange={setSmoker} />
            <Toggle label="Consommation excessive d'alcool" value={alcohol} onChange={setAlcohol} />
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading || !basePatient}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700
              text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Calcul en cours...</>
              : <><RefreshCw className="w-4 h-4" /> Recalculer mon risque</>}
          </button>
        </div>

        {/* Before / After */}
        {(baseScore !== null) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-base font-bold text-gray-700 mb-6 text-center">Comparaison avant / après</h2>

            <div className="flex items-center justify-around gap-4">
              <MiniGauge score={baseScore} label="Score actuel" />

              <div className="flex flex-col items-center gap-1 text-gray-300">
                <div className="w-px h-8 bg-gray-200" />
                <span className="text-xs font-bold text-gray-400">VS</span>
                <div className="w-px h-8 bg-gray-200" />
              </div>

              {simDone && simScore !== null
                ? <MiniGauge score={simScore} label="Score simulé" />
                : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-semibold text-gray-400">Score simulé</p>
                    <div className="w-[110px] h-[110px] rounded-full border-4 border-dashed border-gray-200
                      flex items-center justify-center text-xs text-gray-400 text-center px-3">
                      Modifiez vos habitudes et recalculez
                    </div>
                  </div>
                )
              }
            </div>

            {/* Delta message */}
            {delta !== null && (
              <div className={`mt-6 p-4 rounded-xl text-center font-semibold text-sm
                ${improved
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : delta === 0
                    ? 'bg-gray-50 border border-gray-200 text-gray-600'
                    : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {improved ? (
                  <span className="flex items-center justify-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Votre risque passe de{' '}
                    <strong>{Math.round(baseScore! * 100)}%</strong> à{' '}
                    <strong>{Math.round(simScore! * 100)}%</strong>
                    {' '}soit{' '}<strong className="text-green-600">−{delta} points</strong>
                  </span>
                ) : delta === 0 ? (
                  <span>Votre risque reste stable à <strong>{Math.round(baseScore! * 100)}%</strong>.</span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Votre risque passe de{' '}
                    <strong>{Math.round(baseScore! * 100)}%</strong> à{' '}
                    <strong>{Math.round(simScore! * 100)}%</strong>
                    {' '}soit{' '}<strong>+{Math.abs(delta)} points</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* No data fallback */}
        {baseScore === null && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
            <p className="text-gray-500">Aucune évaluation trouvée.</p>
            <button onClick={() => navigate('/assessment')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
              Faire l'évaluation
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
