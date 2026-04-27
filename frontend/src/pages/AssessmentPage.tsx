import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, User, Heart, Salad, Stethoscope, Activity, Loader2 } from 'lucide-react'
import { predictDiabetes, type PatientData } from '../services/api'

// ─── label helpers ────────────────────────────────────────────────────────────
const AGE_LABELS: Record<number, string> = {
  1:'18-24', 2:'25-29', 3:'30-34', 4:'35-39', 5:'40-44',
  6:'45-49', 7:'50-54', 8:'55-59', 9:'60-64', 10:'65-69',
  11:'70-74', 12:'75-79', 13:'80+',
}
const HEALTH_LABELS: Record<number, string> = {
  1:'Excellente', 2:'Très bonne', 3:'Bonne', 4:'Passable', 5:'Mauvaise',
}

// ─── sub-components ────────────────────────────────────────────────────────────
function YesNo({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="flex gap-3">
        {[{ v: 1, l: 'Oui' }, { v: 0, l: 'Non' }].map(({ v, l }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition-all
              ${value === v
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function SliderField({ label, value, min, max, onChange, unit }: {
  label: string; value: number; min: number; max: number
  onChange: (v: number) => void; unit?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <span className="text-blue-600 font-semibold text-sm">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

// ─── default form state ────────────────────────────────────────────────────────
type FormState = {
  Age: number; Sex: number | null; BMI: number
  HighBP: number | null; HighChol: number | null; CholCheck: number | null
  Stroke: number | null; HeartDiseaseorAttack: number | null; GenHlth: number
  PhysActivity: number | null; Fruits: number | null; Veggies: number | null
  Smoker: number | null; HvyAlcoholConsump: number | null; DiffWalk: number | null
  AnyHealthcare: number | null; NoDocbcCost: number | null
  MentHlth: number; PhysHlth: number
  weight: number; height: number
}

const DEFAULTS: FormState = {
  Age: 5, Sex: null, BMI: 25,
  HighBP: null, HighChol: null, CholCheck: null, Stroke: null,
  HeartDiseaseorAttack: null, GenHlth: 3,
  PhysActivity: null, Fruits: null, Veggies: null,
  Smoker: null, HvyAlcoholConsump: null, DiffWalk: null,
  AnyHealthcare: null, NoDocbcCost: null,
  MentHlth: 0, PhysHlth: 0,
  weight: 70, height: 170,
}

const STEP_TITLES = ['Profil général', 'Santé générale', 'Habitudes de vie', 'Accès aux soins']
const STEP_ICONS  = [User, Heart, Salad, Stethoscope]

export default function AssessmentPage() {
  const navigate = useNavigate()
  const { handleSubmit } = useForm()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)   // synchronous guard, immune to React batch updates

  const set = (k: keyof FormState, v: number) => setForm(prev => {
    const next = { ...prev, [k]: v }
    if (k === 'weight' || k === 'height') {
      next.BMI = parseFloat((next.weight / (next.height / 100) ** 2).toFixed(1))
    }
    return next
  })

  // ─── validation per step
  const validateStep = (): boolean => {
    if (step === 0 && form.Sex === null) {
      toast.error('Veuillez sélectionner votre sexe.'); return false
    }
    if (step === 1) {
      const required: (keyof FormState)[] = ['HighBP','HighChol','CholCheck','Stroke','HeartDiseaseorAttack']
      if (required.some(k => form[k] === null)) {
        toast.error('Veuillez répondre à toutes les questions.'); return false
      }
    }
    if (step === 2) {
      const required: (keyof FormState)[] = ['PhysActivity','Fruits','Veggies','Smoker','HvyAlcoholConsump','DiffWalk']
      if (required.some(k => form[k] === null)) {
        toast.error('Veuillez répondre à toutes les questions.'); return false
      }
    }
    if (step === 3) {
      const required: (keyof FormState)[] = ['AnyHealthcare','NoDocbcCost']
      if (required.some(k => form[k] === null)) {
        toast.error('Veuillez répondre à toutes les questions.'); return false
      }
    }
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const onSubmit = async () => {
    if (submittingRef.current) return          // block any click before re-render
    if (!validateStep()) return
    submittingRef.current = true
    setLoading(true)
    try {
      const payload: PatientData = {
        HighBP:               form.HighBP!,
        HighChol:             form.HighChol!,
        CholCheck:            form.CholCheck!,
        BMI:                  form.BMI,
        Smoker:               form.Smoker!,
        Stroke:               form.Stroke!,
        HeartDiseaseorAttack: form.HeartDiseaseorAttack!,
        PhysActivity:         form.PhysActivity!,
        Fruits:               form.Fruits!,
        Veggies:              form.Veggies!,
        HvyAlcoholConsump:    form.HvyAlcoholConsump!,
        AnyHealthcare:        form.AnyHealthcare!,
        NoDocbcCost:          form.NoDocbcCost!,
        GenHlth:              form.GenHlth,
        MentHlth:             form.MentHlth,
        PhysHlth:             form.PhysHlth,
        DiffWalk:             form.DiffWalk!,
        Sex:                  form.Sex!,
        Age:                  form.Age,
      }
      const result = await predictDiabetes(payload)
      navigate('/results', { state: { result, patientData: payload } })
    } catch {
      // error already shown via toast in api.ts
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  const progressPct = ((step + 1) / 4) * 100

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Évaluation du risque diabétique</h1>
          <p className="text-gray-500 mt-1">Étape {step + 1} sur 4 — {STEP_TITLES[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEP_TITLES.map((t, i) => {
              const Icon = STEP_ICONS[i]
              return (
                <div key={t} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${i < step ? 'bg-blue-600 border-blue-600 text-white'
                      : i === step ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-gray-200 text-gray-300 bg-white'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs hidden sm:block ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>{t}</span>
                </div>
              )
            })}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── STEP 0 : Profil général ── */}
            {step === 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Sexe</p>
                  <div className="flex gap-3">
                    {[{ v: 1, l: 'Homme' }, { v: 0, l: 'Femme' }].map(({ v, l }) => (
                      <button key={v} type="button" onClick={() => set('Sex', v)}
                        className={`flex-1 py-3 rounded-lg border-2 font-medium transition-all
                          ${form.Sex === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <SliderField label={`Tranche d'âge`} value={form.Age} min={1} max={13}
                  onChange={v => set('Age', v)} unit={` (${AGE_LABELS[form.Age]} ans)`} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Poids (kg)</label>
                    <input type="number" min={30} max={250} value={form.weight}
                      onChange={e => set('weight', Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Taille (cm)</label>
                    <input type="number" min={100} max={250} value={form.height}
                      onChange={e => set('height', Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">IMC calculé</span>
                  <span className={`text-lg font-bold ${form.BMI >= 30 ? 'text-red-500' : form.BMI >= 25 ? 'text-orange-500' : 'text-green-600'}`}>
                    {form.BMI} kg/m²
                  </span>
                </div>

              </div>
            )}

            {/* ── STEP 1 : Santé générale ── */}
            {step === 1 && (
              <div className="space-y-5">
                <YesNo label="Avez-vous une tension artérielle élevée ?" value={form.HighBP} onChange={v => set('HighBP', v)} />
                <YesNo label="Avez-vous un cholestérol élevé ?" value={form.HighChol} onChange={v => set('HighChol', v)} />
                <YesNo label="Avez-vous fait un bilan cholestérol dans les 5 dernières années ?" value={form.CholCheck} onChange={v => set('CholCheck', v)} />
                <YesNo label="Avez-vous déjà eu un AVC ?" value={form.Stroke} onChange={v => set('Stroke', v)} />
                <YesNo label="Avez-vous une maladie coronarienne ou avez-vous eu un infarctus ?" value={form.HeartDiseaseorAttack} onChange={v => set('HeartDiseaseorAttack', v)} />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Comment évaluez-vous votre santé générale ?</label>
                  <select value={form.GenHlth} onChange={e => set('GenHlth', Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                    {Object.entries(HEALTH_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── STEP 2 : Habitudes de vie ── */}
            {step === 2 && (
              <div className="space-y-5">
                <YesNo label="Avez-vous pratiqué une activité physique dans les 30 derniers jours ?" value={form.PhysActivity} onChange={v => set('PhysActivity', v)} />
                <YesNo label="Consommez-vous des fruits au moins 1 fois par jour ?" value={form.Fruits} onChange={v => set('Fruits', v)} />
                <YesNo label="Consommez-vous des légumes au moins 1 fois par jour ?" value={form.Veggies} onChange={v => set('Veggies', v)} />
                <YesNo label="Avez-vous fumé au moins 100 cigarettes dans votre vie ?" value={form.Smoker} onChange={v => set('Smoker', v)} />
                <YesNo label="Consommez-vous de l'alcool de façon excessive ?" value={form.HvyAlcoholConsump} onChange={v => set('HvyAlcoholConsump', v)} />
                <YesNo label="Avez-vous des difficultés à marcher ou à monter les escaliers ?" value={form.DiffWalk} onChange={v => set('DiffWalk', v)} />
              </div>
            )}

            {/* ── STEP 3 : Accès aux soins ── */}
            {step === 3 && (
              <div className="space-y-6">
                <YesNo label="Disposez-vous d'une couverture santé ?" value={form.AnyHealthcare} onChange={v => set('AnyHealthcare', v)} />
                <YesNo label="Avez-vous renoncé à consulter un médecin à cause du coût ?" value={form.NoDocbcCost} onChange={v => set('NoDocbcCost', v)} />
                <SliderField label="Jours de mauvaise santé mentale (30 derniers jours)"
                  value={form.MentHlth} min={0} max={30} onChange={v => set('MentHlth', v)} unit=" j" />
                <SliderField label="Jours de mauvaise santé physique (30 derniers jours)"
                  value={form.PhysHlth} min={0} max={30} onChange={v => set('PhysHlth', v)} unit=" j" />
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button type="button" onClick={back}
                  className="flex items-center gap-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 transition-all">
                  <ChevronLeft className="w-4 h-4" /> Précédent
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={next}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all">
                  Suivant <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={onSubmit} disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-xl transition-all
                    ${loading
                      ? 'bg-green-400 cursor-not-allowed pointer-events-none'
                      : 'bg-green-600 hover:bg-green-700'}`}>
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyse en cours…</>
                    : <><Activity className="w-5 h-5" /> Obtenir mon résultat</>}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
