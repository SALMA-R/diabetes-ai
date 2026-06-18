import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, RefreshCw,
  FileDown, ArrowLeft, Shield, MessageCircle, LayoutDashboard,
} from 'lucide-react'
import type { PatientData, PredictionResult } from '../services/api'

// ─── feature name translations ────────────────────────────────────────────────
const FEATURE_NAMES: Record<string, string> = {
  Age                 : 'Âge',
  BMI                 : 'Indice de masse corporelle (IMC)',
  HighBP              : 'Tension artérielle élevée',
  HighChol            : 'Cholestérol élevé',
  CholCheck           : 'Contrôle du cholestérol',
  Smoker              : 'Tabagisme',
  Stroke              : "Antécédent d'AVC",
  HeartDiseaseorAttack: 'Maladie cardiaque',
  PhysActivity        : 'Activité physique',
  Fruits              : 'Consommation de fruits',
  Veggies             : 'Consommation de légumes',
  HvyAlcoholConsump   : 'Alcool excessif',
  AnyHealthcare       : 'Couverture santé',
  NoDocbcCost         : 'Renoncement aux soins',
  GenHlth             : 'Santé générale',
  MentHlth            : 'Santé mentale',
  PhysHlth            : 'Santé physique',
  DiffWalk            : 'Difficulté à marcher',
  Sex                 : 'Sexe',
  Education           : 'Éducation',
  Income              : 'Revenu',
}

// ─── circular gauge ───────────────────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 80)
    return () => clearTimeout(t)
  }, [score])

  const RADIUS       = 54
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const riskPercent  = Math.round(animated * 100)
  const offset       = CIRCUMFERENCE - (riskPercent / 100) * CIRCUMFERENCE
  const gaugeColor   = riskPercent < 30 ? '#16a34a' : riskPercent < 60 ? '#ea580c' : '#dc2626'

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={RADIUS}
          fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle cx="80" cy="80" r={RADIUS}
          fill="none" stroke={gaugeColor} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }} />
        <text x="80" y="72" textAnchor="middle"
          fontSize="28" fontWeight="bold" fill={gaugeColor}>
          {riskPercent}%
        </text>
        <text x="80" y="92" textAnchor="middle"
          fontSize="13" fill="#6b7280">
          de risque
        </text>
      </svg>
    </div>
  )
}

// ─── classification badge ─────────────────────────────────────────────────────
const BADGE_CONFIG = {
  'Normal'         : { icon: <CheckCircle  className="w-5 h-5" />, bg: 'bg-green-100', text: 'text-green-700',  border: 'border-green-300' },
  'Pre-diabetique' : { icon: <AlertTriangle className="w-5 h-5" />, bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300'  },
  'Diabetique'     : { icon: <XCircle      className="w-5 h-5" />, bg: 'bg-red-100',   text: 'text-red-700',    border: 'border-red-300'    },
}

// ─── main component ───────────────────────────────────────────────────────────
function loadSavedResult(): PredictionResult | null {
  try {
    const raw = localStorage.getItem('lastPrediction')
    return raw ? (JSON.parse(raw) as PredictionResult) : null
  } catch { return null }
}

export default function ResultsPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()
  const printRef  = useRef<HTMLDivElement>(null)

  // Use navigation state first; fall back to localStorage so back-navigation works
  const result: PredictionResult | null =
    (state?.result as PredictionResult | undefined) ?? loadSavedResult()
  const patientData: PatientData | undefined = state?.patientData

  // Persist everything for WhatIfPage, Dashboard and back-navigation
  useEffect(() => {
    if (result) {
      localStorage.setItem('lastPrediction', JSON.stringify(result))
      localStorage.setItem('lastRiskScore', String(result.risk_score))
    }
    if (patientData) {
      localStorage.setItem('lastPatientData', JSON.stringify(patientData))
    }
    if (result) {
      try {
        const raw     = localStorage.getItem('riskHistory')
        const history = raw ? JSON.parse(raw) as { date: string; score: number; classification: string }[] : []
        // Only push if this is a fresh navigation (not restored from localStorage)
        if (state?.result) {
          history.push({ date: new Date().toISOString(), score: result.risk_score, classification: result.classification })
          localStorage.setItem('riskHistory', JSON.stringify(history.slice(-20)))
        }
      } catch { /* ignore */ }
    }
  }, [result, patientData, state?.result])

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Aucun résultat disponible.</p>
          <button onClick={() => navigate('/assessment')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg">
            Faire l'évaluation
          </button>
        </div>
      </div>
    )
  }

  const badge  = BADGE_CONFIG[result.classification as keyof typeof BADGE_CONFIG] ?? BADGE_CONFIG['Normal']
  const label  = result.classification === 'Pre-diabetique' ? 'Pré-diabétique' : result.classification

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" ref={printRef}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back button */}
        <button onClick={() => navigate('/assessment')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Refaire l'évaluation
        </button>

        {/* ── Risk score card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Votre résultat</h1>

          <div className="flex justify-center mb-8">
            <RiskGauge score={result.risk_score} />
          </div>

          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border text-base font-semibold
            ${badge.bg} ${badge.text} ${badge.border}`}>
            {badge.icon}
            {label}
          </div>

          <p className="text-gray-500 mt-4 max-w-md mx-auto">{result.message}</p>
        </div>

        {/* ── Top 3 factors ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top 3 facteurs influents
          </h2>
          <div className="space-y-4">
            {result.top_3_factors.map((f, i) => {
              const isRisk = f.shap_value > 0
              const barPct = Math.min(Math.abs(f.shap_value) * 120, 100)
              const delays = [0, 150, 300]
              return (
                <div key={f.feature} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-medium text-gray-700">{FEATURE_NAMES[f.feature] ?? f.feature}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold
                      ${isRisk ? 'text-red-500' : 'text-green-600'}`}>
                      {isRisk
                        ? <><TrendingUp className="w-4 h-4" /> ↑ augmente le risque</>
                        : <><TrendingDown className="w-4 h-4" /> ↓ réduit le risque</>}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${isRisk ? 'bg-red-400' : 'bg-green-400'}`}
                      style={{
                        width: `${barPct}%`,
                        transition: `width 0.8s ease-out ${delays[i]}ms`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Recommandations personnalisées
          </h2>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex-shrink-0 w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate('/whatif')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-blue-200 text-blue-600 font-medium hover:bg-blue-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Simuler une amélioration
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-purple-200 text-purple-600 font-medium hover:bg-purple-50 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Parler à l'assistant
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-green-200 text-green-600 font-medium hover:bg-green-50 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Mon tableau de bord
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-medium transition-all"
          >
            <FileDown className="w-4 h-4" />
            Télécharger rapport PDF
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Ce résultat est fourni à titre indicatif et ne remplace pas un avis médical professionnel.
        </p>
      </div>
    </div>
  )
}
