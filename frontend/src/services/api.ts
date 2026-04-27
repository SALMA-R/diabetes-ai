import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({ baseURL: 'http://localhost:8000' })

// Education and Income are fixed at 5 (median) — not collected from the user
export interface PatientData {
  HighBP: number
  HighChol: number
  CholCheck: number
  BMI: number
  Smoker: number
  Stroke: number
  HeartDiseaseorAttack: number
  PhysActivity: number
  Fruits: number
  Veggies: number
  HvyAlcoholConsump: number
  AnyHealthcare: number
  NoDocbcCost: number
  GenHlth: number
  MentHlth: number
  PhysHlth: number
  DiffWalk: number
  Sex: number
  Age: number
}

export interface SHAPFactor {
  feature        : string
  shap_value     : number
  direction      : string
  shap_direction : 'positive' | 'negative'
}

export interface PredictionResult {
  risk_score: number
  classification: string
  top_3_factors: SHAPFactor[]
  message: string
  recommendations: string[]
}

// module-level guard — also reset on HMR via the ref in the component
let _requesting = false

export function resetRequestingGuard() { _requesting = false }

export async function predictDiabetes(patientData: PatientData): Promise<PredictionResult> {
  if (_requesting) return Promise.reject(new Error('already requesting'))
  _requesting = true
  try {
    const payload = { ...patientData, Education: 5, Income: 5 }
    const { data } = await api.post<PredictionResult>('/predict', payload)
    return data
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const isOffline =
        err.code === 'ERR_NETWORK' ||
        err.message === 'Network Error' ||
        err.response === undefined
      if (isOffline) {
        toast.error('Le serveur est hors ligne. Lancez : cd backend && python run.py', {
          duration: 6000,
          id: 'server-offline',
        })
      } else {
        const raw    = err.response?.data?.detail
        const detail = Array.isArray(raw)
          ? raw.map((e: { msg?: string }) => e.msg ?? JSON.stringify(e)).join(', ')
          : raw ? String(raw) : `Erreur serveur (${err.response?.status ?? '?'})`
        toast.error(detail, { id: 'predict-error', duration: 5000 })
      }
    }
    throw err
  } finally {
    setTimeout(() => { _requesting = false }, 500)
  }
}

export async function getRecommendations(profile: PatientData): Promise<string[]> {
  try {
    const { data } = await api.post<{ recommendations: string[] }>('/recommend', profile)
    return data.recommendations
  } catch (err: unknown) {
    const message =
      axios.isAxiosError(err) && err.response?.data?.detail
        ? String(err.response.data.detail)
        : 'Erreur lors du chargement des recommandations.'
    toast.error(message)
    throw err
  }
}
