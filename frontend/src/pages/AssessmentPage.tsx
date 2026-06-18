import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Check, X, Heart, Loader2, Activity } from 'lucide-react'
import { predictDiabetes, type PatientData } from '../services/api'

// ─── label maps ────────────────────────────────────────────────────────────────
const AGE_LABELS: Record<number, string> = {
  1:'18-24', 2:'25-29', 3:'30-34', 4:'35-39', 5:'40-44',
  6:'45-49', 7:'50-54', 8:'55-59', 9:'60-64', 10:'65-69',
  11:'70-74', 12:'75-79', 13:'80+',
}
const HEALTH_LABELS: Record<number, string> = {
  1:'Excellente', 2:'Très bonne', 3:'Bonne', 4:'Passable', 5:'Mauvaise',
}

// ─── sub-components ────────────────────────────────────────────────────────────
function YesNo({
  label, value, onChange, emoji,
}: {
  label: string; value: number | null; onChange: (v: number) => void; emoji?: string
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold text-[#1E293B] leading-snug">
        {emoji && <span className="mr-2 text-base">{emoji}</span>}
        {label}
      </p>
      <div className="flex gap-3">
        {([{ v: 1, l: 'Oui', icon: <Check className="w-4 h-4" /> },
           { v: 0, l: 'Non', icon: <X   className="w-4 h-4" /> }] as const).map(({ v, l, icon }) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all duration-200 hover:-translate-y-px
              ${value === v
                ? v === 1
                  ? 'border-[#00A86B] bg-[#F0FFF8] text-[#007A4D]'
                  : 'border-red-400 bg-red-50 text-red-600'
                : 'border-gray-200 bg-white text-[#64748B] hover:border-gray-300 hover:bg-gray-50'}`}>
            {icon}{l}
          </button>
        ))}
      </div>
    </div>
  )
}

function MultiChoice({
  label, value, onChange, options, emoji,
}: {
  label: string; value: number | null; onChange: (v: number) => void
  options: { v: number; l: string }[]; emoji?: string
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold text-[#1E293B] leading-snug">
        {emoji && <span className="mr-2 text-base">{emoji}</span>}
        {label}
      </p>
      <div className="flex gap-2 flex-wrap">
        {options.map(({ v, l }) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`flex-1 min-w-fit py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 border-2 text-center
              ${value === v
                ? 'bg-[#00A86B] border-[#00A86B] text-white'
                : 'bg-white border-gray-200 text-[#64748B] hover:border-gray-300 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function SliderField({
  label, value, min, max, onChange, unit,
}: {
  label: string; value: number; min: number; max: number
  onChange: (v: number) => void; unit?: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-[#1E293B]">{label}</label>
        <span className="bg-[#F0FFF8] border border-[#00A86B]/30 text-[#007A4D] text-sm font-bold px-3 py-1 rounded-full">
          {value}{unit}
        </span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full cursor-pointer" style={{ accentColor: '#00A86B' }} />
      <div className="flex justify-between text-xs text-[#64748B]">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )
}

// ─── BMI ───────────────────────────────────────────────────────────────────────
function getBMIInfo(bmi: number) {
  if (bmi < 18.5) return { label: 'Insuffisance pondérale', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200'        }
  if (bmi < 25)   return { label: 'Poids normal',           color: 'text-[#007A4D]',  bg: 'bg-[#F0FFF8] border-[#00A86B]/30'  }
  if (bmi < 30)   return { label: 'Surpoids',               color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200'     }
                  return { label: 'Obésité',                 color: 'text-red-600',    bg: 'bg-red-50 border-red-200'           }
}

// ─── form types ────────────────────────────────────────────────────────────────
type FormState = {
  // CDC fields
  Age: number; Sex: number | null; BMI: number
  HighBP: number | null; HighChol: number | null; CholCheck: number | null
  Stroke: number | null; HeartDiseaseorAttack: number | null; GenHlth: number
  PhysActivity: number | null; Fruits: number | null; Veggies: number | null
  Smoker: number | null; HvyAlcoholConsump: number | null; DiffWalk: number | null
  AnyHealthcare: number | null; NoDocbcCost: number | null
  MentHlth: number; PhysHlth: number
  weight: number; height: number
  // Step 5 — Extended lifestyle
  sleepHours       : number
  sleepDisorders   : number | null
  homemadeMealsWeek: number
  sugaryDrinks     : number | null
  stressLevel      : number
  relaxationPractice: number | null
  familyDiabetes   : number | null
  familyHeart      : number | null
  waterGlasses     : number
  sedentaryHours   : number
  ultra_processed  : number | null
}

const DEFAULTS: FormState = {
  Age: 5, Sex: null,
  weight: 70, height: 170,
  BMI: parseFloat((70 / (170 / 100) ** 2).toFixed(1)), // 24.2
  // C6 — pre-filled sensible defaults
  HighBP: 0, HighChol: 0, CholCheck: 1, Stroke: 0, HeartDiseaseorAttack: 0,
  GenHlth: 3,
  PhysActivity: 1, Fruits: 1, Veggies: 1, Smoker: 0, HvyAlcoholConsump: 0, DiffWalk: 0,
  AnyHealthcare: 1, NoDocbcCost: 0,
  MentHlth: 0, PhysHlth: 0,
  // Step 5 defaults
  sleepHours: 7, sleepDisorders: null, homemadeMealsWeek: 14,
  sugaryDrinks: null, stressLevel: 3, relaxationPractice: null,
  familyDiabetes: null, familyHeart: null, waterGlasses: 6, sedentaryHours: 6,
  ultra_processed: null,
}

const STEP_CONFIG = [
  { title: 'Profil général',   subtitle: 'Vos informations de base'                    },
  { title: 'Santé générale',   subtitle: 'Votre état de santé actuel'                  },
  { title: 'Habitudes de vie', subtitle: 'Votre mode de vie quotidien'                 },
  { title: 'Accès aux soins',  subtitle: 'Votre accès au système de santé'             },
  { title: 'Hygiène avancée',  subtitle: 'Sommeil, stress et antécédents familiaux'    },
]

// ─── page ──────────────────────────────────────────────────────────────────────
export default function AssessmentPage() {
  const navigate = useNavigate()
  const { handleSubmit } = useForm()
  const [step, setStep]     = useState(0)
  const [form, setForm]     = useState<FormState>(DEFAULTS)
  const [loading, setLoading] = useState(false)
  const submittingRef = useRef(false)

  const set = (k: keyof FormState, v: number) =>
    setForm(prev => {
      const next = { ...prev, [k]: v }
      if (k === 'weight' || k === 'height') {
        next.BMI = parseFloat((next.weight / (next.height / 100) ** 2).toFixed(1))
      }
      return next
    })

  const validateStep = (): boolean => {
    if (step === 0 && form.Sex === null) {
      toast.error('Veuillez sélectionner votre sexe.'); return false
    }
    if (step === 1) {
      const req: (keyof FormState)[] = ['HighBP','HighChol','CholCheck','Stroke','HeartDiseaseorAttack']
      if (req.some(k => form[k] === null)) { toast.error('Veuillez répondre à toutes les questions.'); return false }
    }
    if (step === 2) {
      const req: (keyof FormState)[] = ['PhysActivity','Fruits','Veggies','Smoker','HvyAlcoholConsump','DiffWalk']
      if (req.some(k => form[k] === null)) { toast.error('Veuillez répondre à toutes les questions.'); return false }
    }
    if (step === 3) {
      const req: (keyof FormState)[] = ['AnyHealthcare','NoDocbcCost']
      if (req.some(k => form[k] === null)) { toast.error('Veuillez répondre à toutes les questions.'); return false }
    }
    if (step === 4) {
      const req: (keyof FormState)[] = ['sleepDisorders','sugaryDrinks','ultra_processed','relaxationPractice','familyDiabetes','familyHeart']
      if (req.some(k => form[k] === null)) { toast.error('Veuillez répondre à toutes les questions.'); return false }
    }
    return true
  }

  const next = () => { if (validateStep()) setStep(s => s + 1) }
  const back = () => setStep(s => s - 1)

  const onSubmit = async () => {
    if (submittingRef.current) return
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
        // Extended lifestyle fields
        sleep_hours:          form.sleepHours,
        sleep_disorders:      form.sleepDisorders!,
        homemade_meals_week:  form.homemadeMealsWeek,
        sugary_drinks:        form.sugaryDrinks!,
        stress_level:         form.stressLevel,
        relaxation_practice:  form.relaxationPractice!,
        family_diabetes:      form.familyDiabetes!,
        family_heart:         form.familyHeart!,
        water_glasses:        form.waterGlasses,
        sedentary_hours:      form.sedentaryHours,
        ultra_processed:      form.ultra_processed ?? 0,
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

  const bmiInfo = getBMIInfo(form.BMI)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* ── Fixed header ── */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100"
        style={{ boxShadow: '0 2px 12px rgba(0,168,107,0.08)' }}>
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <button type="button" onClick={() => navigate('/')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#00A86B] rounded-xl flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-[#1E293B] text-lg tracking-tight">DiabetesAI</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#64748B] font-medium hidden sm:block">
              Étape {step + 1} / 5
            </span>
            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${((step + 1) / 5) * 100}%`, background: 'linear-gradient(90deg, #00A86B, #007A4D)' }} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* ── Step indicator ── */}
        <div className="flex items-start justify-center mb-10">
          {STEP_CONFIG.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
                    ${i <= step
                      ? 'bg-[#00A86B] border-[#00A86B] text-white'
                      : 'bg-white border-gray-200 text-[#64748B]'}`}
                  style={i === step ? { boxShadow: '0 0 0 4px rgba(0,168,107,0.18)' } : {}}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block whitespace-nowrap transition-colors duration-300
                  ${i === step ? 'text-[#00A86B]' : i < step ? 'text-[#64748B]' : 'text-gray-300'}`}>
                  {s.title}
                </span>
              </div>
              {i < 4 && (
                <div className={`w-8 sm:w-14 h-0.5 mx-1 mb-6 transition-all duration-500
                  ${i < step ? 'bg-[#00A86B]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Main card ── */}
        <div className="bg-white rounded-2xl p-8"
          style={{ boxShadow: '0 20px 60px rgba(0,168,107,0.10), 0 4px 16px rgba(0,0,0,0.06)' }}>

          {/* Card header */}
          <div className="flex items-start gap-4 mb-8 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 bg-[#00A86B] rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-extrabold text-lg">
              {step + 1}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1E293B]">{STEP_CONFIG[step].title}</h2>
              <p className="text-[#64748B] text-sm mt-0.5">{STEP_CONFIG[step].subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div key={step} className="step-animate">

              {/* ── STEP 0 : Profil général ── */}
              {step === 0 && (
                <div className="space-y-7">
                  {/* Gender */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#1E293B]">Sexe biologique</p>
                    <div className="flex gap-4">
                      {[
                        { v: 1, l: 'Homme', symbol: '♂' },
                        { v: 0, l: 'Femme', symbol: '♀' },
                      ].map(({ v, l, symbol }) => (
                        <button key={v} type="button" onClick={() => set('Sex', v)}
                          className={`flex-1 py-5 rounded-2xl border-2 flex flex-col items-center gap-2 font-bold text-sm transition-all duration-300 hover:-translate-y-0.5
                            ${form.Sex === v
                              ? 'bg-green-50 border-green-500 text-green-700'
                              : 'border-gray-200 bg-white text-[#64748B] hover:border-gray-300'}`}>
                          <span className="text-3xl leading-none">{symbol}</span>{l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-[#1E293B]">Tranche d'âge</label>
                      <span className="bg-[#F0FFF8] border border-[#00A86B]/30 text-[#007A4D] text-sm font-bold px-3 py-1 rounded-full">
                        {AGE_LABELS[form.Age]} ans
                      </span>
                    </div>
                    <input type="range" min={1} max={13} value={form.Age}
                      onChange={e => set('Age', Number(e.target.value))}
                      className="w-full cursor-pointer" style={{ accentColor: '#00A86B' }} />
                    <div className="flex justify-between text-xs text-[#64748B]">
                      <span>18 ans</span><span>80+ ans</span>
                    </div>
                  </div>

                  {/* Weight / Height */}
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      { key: 'weight', label: 'Poids',  unit: 'kg', min: 30,  max: 250 },
                      { key: 'height', label: 'Taille', unit: 'cm', min: 100, max: 250 },
                    ] as const).map(({ key, label, unit, min, max }) => (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-semibold text-[#1E293B]">{label}</label>
                        <div className="relative">
                          <input type="number" min={min} max={max} value={form[key]}
                            onChange={e => set(key, Number(e.target.value))}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-[#00A86B] transition-colors duration-200 text-[#1E293B] font-semibold" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#64748B] font-medium pointer-events-none">{unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* BMI badge */}
                  <div className={`rounded-xl px-5 py-4 border flex items-center justify-between ${bmiInfo.bg}`}>
                    <div>
                      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider">IMC calculé</p>
                      <p className={`text-sm font-semibold mt-0.5 ${bmiInfo.color}`}>{bmiInfo.label}</p>
                    </div>
                    <span className={`text-2xl font-extrabold ${bmiInfo.color}`}>
                      {form.BMI} <span className="text-sm font-medium">kg/m²</span>
                    </span>
                  </div>
                </div>
              )}

              {/* ── STEP 1 : Santé générale ── */}
              {step === 1 && (
                <div className="space-y-5">
                  <YesNo label="Avez-vous une tension artérielle élevée ?"                         value={form.HighBP}             onChange={v => set('HighBP', v)} />
                  <YesNo label="Avez-vous un cholestérol élevé ?"                                  value={form.HighChol}           onChange={v => set('HighChol', v)} />
                  <YesNo label="Avez-vous fait un bilan cholestérol dans les 5 dernières années ?" value={form.CholCheck}          onChange={v => set('CholCheck', v)} />
                  <YesNo label="Avez-vous déjà eu un AVC ?"                                        value={form.Stroke}             onChange={v => set('Stroke', v)} />
                  <YesNo label="Avez-vous une maladie coronarienne ou avez-vous eu un infarctus ?" value={form.HeartDiseaseorAttack} onChange={v => set('HeartDiseaseorAttack', v)} />
                  {/* GenHlth */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#1E293B]">Comment évaluez-vous votre santé générale ?</p>
                    <div className="flex gap-2">
                      {Object.entries(HEALTH_LABELS).map(([k, v]) => (
                        <button key={k} type="button" onClick={() => set('GenHlth', Number(k))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border-2 leading-tight text-center
                            ${form.GenHlth === Number(k) ? 'bg-[#00A86B] border-[#00A86B] text-white' : 'bg-white border-gray-200 text-[#64748B] hover:border-gray-300'}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2 : Habitudes de vie ── */}
              {step === 2 && (
                <div className="space-y-5">
                  <YesNo emoji="🏃" label="Avez-vous pratiqué une activité physique dans les 30 derniers jours ?" value={form.PhysActivity}       onChange={v => set('PhysActivity', v)} />
                  <YesNo emoji="🍎" label="Consommez-vous des fruits au moins 1 fois par jour ?"                  value={form.Fruits}              onChange={v => set('Fruits', v)} />
                  <YesNo emoji="🥦" label="Consommez-vous des légumes au moins 1 fois par jour ?"                value={form.Veggies}             onChange={v => set('Veggies', v)} />
                  <YesNo emoji="🚬" label="Avez-vous fumé au moins 100 cigarettes dans votre vie ?"              value={form.Smoker}              onChange={v => set('Smoker', v)} />
                  <YesNo emoji="🍺" label="Consommez-vous de l'alcool de façon excessive ?"                      value={form.HvyAlcoholConsump}   onChange={v => set('HvyAlcoholConsump', v)} />
                  <YesNo emoji="🚶" label="Avez-vous des difficultés à marcher ou à monter les escaliers ?"      value={form.DiffWalk}            onChange={v => set('DiffWalk', v)} />
                </div>
              )}

              {/* ── STEP 3 : Accès aux soins ── */}
              {step === 3 && (
                <div className="space-y-7">
                  <YesNo label="Disposez-vous d'une couverture santé ?"                       value={form.AnyHealthcare} onChange={v => set('AnyHealthcare', v)} />
                  <YesNo label="Avez-vous renoncé à consulter un médecin à cause du coût ?"  value={form.NoDocbcCost}   onChange={v => set('NoDocbcCost', v)} />
                  <SliderField label="Jours de mauvaise santé mentale (30 derniers jours)"
                    value={form.MentHlth} min={0} max={30} onChange={v => set('MentHlth', v)} unit=" j" />
                  <SliderField label="Jours de mauvaise santé physique (30 derniers jours)"
                    value={form.PhysHlth} min={0} max={30} onChange={v => set('PhysHlth', v)} unit=" j" />
                </div>
              )}

              {/* ── STEP 4 : Hygiène de vie avancée ── */}
              {step === 4 && (
                <div className="space-y-6">

                  {/* Sommeil */}
                  <div className="rounded-xl border border-[#00A86B]/20 bg-[#F0FFF8]/50 p-5 space-y-5">
                    <p className="text-xs font-bold text-[#007A4D] uppercase tracking-wider">🌙 Sommeil</p>
                    <SliderField label="Heures de sommeil par nuit"
                      value={form.sleepHours} min={4} max={12} onChange={v => set('sleepHours', v)} unit=" h" />
                    <YesNo label="Avez-vous des troubles du sommeil ou de l'insomnie ?"
                      value={form.sleepDisorders} onChange={v => set('sleepDisorders', v)} />
                  </div>

                  {/* Alimentation */}
                  <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-5 space-y-5">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">🍽 Alimentation</p>
                    <SliderField label="Repas faits-maison par semaine"
                      value={form.homemadeMealsWeek} min={0} max={21} onChange={v => set('homemadeMealsWeek', v)} unit=" repas" />
                    <MultiChoice label="Consommez-vous des boissons sucrées / sodas ?"
                      value={form.sugaryDrinks} onChange={v => set('sugaryDrinks', v)}
                      options={[{ v: 0, l: 'Jamais' }, { v: 1, l: 'Rarement' }, { v: 2, l: 'Souvent' }, { v: 3, l: 'Quotidien' }]} />
                    <SliderField label="Verres d'eau par jour 💧"
                      value={form.waterGlasses} min={0} max={12} onChange={v => set('waterGlasses', v)} unit=" v." />
                    <MultiChoice
                      label="Consommez-vous des produits ultra-transformés (plats préparés, fast-food, chips...) ?"
                      value={form.ultra_processed} onChange={v => set('ultra_processed', v)}
                      options={[{ v: 0, l: 'Rarement' }, { v: 1, l: 'Quelquefois' }, { v: 2, l: 'Souvent' }, { v: 3, l: 'Très souvent' }]} />
                  </div>

                  {/* Stress */}
                  <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-5 space-y-5">
                    <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">🧠 Stress & bien-être</p>
                    <MultiChoice label="Quel est votre niveau de stress habituel ?"
                      value={form.stressLevel} onChange={v => set('stressLevel', v)}
                      options={[
                        { v: 1, l: 'Très faible' }, { v: 2, l: 'Faible' },
                        { v: 3, l: 'Modéré' }, { v: 4, l: 'Élevé' }, { v: 5, l: 'Très élevé' },
                      ]} />
                    <YesNo label="Pratiquez-vous une activité de relaxation ? (méditation, yoga…)"
                      value={form.relaxationPractice} onChange={v => set('relaxationPractice', v)} />
                  </div>

                  {/* Antécédents familiaux */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 space-y-5">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">🧬 Antécédents familiaux</p>
                    <MultiChoice label="Un de vos parents est-il diabétique ?"
                      value={form.familyDiabetes} onChange={v => set('familyDiabetes', v)}
                      options={[{ v: 0, l: 'Aucun' }, { v: 1, l: 'Un parent' }, { v: 2, l: 'Les deux' }]} />
                    <YesNo label="Avez-vous des antécédents familiaux de maladies cardiaques ?"
                      value={form.familyHeart} onChange={v => set('familyHeart', v)} />
                  </div>

                  {/* Activité & Sédentarité */}
                  <div className="rounded-xl border border-[#00A86B]/20 bg-[#F0FFF8]/50 p-5 space-y-4">
                    <p className="text-xs font-bold text-[#007A4D] uppercase tracking-wider">🏃 Activité &amp; Sédentarité</p>
                    <SliderField label="Heures assis/sédentaire par jour"
                      value={form.sedentaryHours} min={0} max={16} onChange={v => set('sedentaryHours', v)} unit=" h" />
                    {form.sedentaryHours >= 8 && (
                      <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5">
                        <span className="mt-0.5">⚠️</span>
                        <span><strong>Plus de 8h/jour</strong> de sédentarité augmente le risque de diabète de <strong>40%</strong></span>
                      </div>
                    )}
                    {form.sedentaryHours < 8 && (
                      <p className="text-xs text-[#64748B] bg-white rounded-lg px-4 py-2.5 border border-gray-100">
                        ⚠️ Au-delà de <strong>8h/jour</strong> de sédentarité, le risque de diabète augmente de <strong>40%</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>{/* end step-animate */}

            {/* ── Navigation ── */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
              {step > 0 && (
                <button type="button" onClick={back}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-200 text-[#64748B] font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                  <ChevronLeft className="w-4 h-4" /> Précédent
                </button>
              )}
              {step < 4 ? (
                <button type="button" onClick={next}
                  className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #00A86B 0%, #007A4D 100%)', boxShadow: '0 4px 16px rgba(0,168,107,0.25)' }}>
                  Suivant <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={onSubmit} disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl transition-all duration-300 active:scale-95
                    ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                  style={{
                    background: 'linear-gradient(135deg, #00A86B 0%, #007A4D 100%)',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(0,168,107,0.30)',
                  }}>
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyse en cours…</>
                    : <><Activity className="w-5 h-5" /> Obtenir mon résultat 🎯</>
                  }
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
