import axios from 'axios'
import toast from 'react-hot-toast'

const authApi = axios.create({ baseURL: 'http://localhost:8000' })

const TOKEN_KEY = 'diabetes_ai_token'
const USER_KEY  = 'diabetes_ai_user'

export interface AuthUser {
  id         : number
  email      : string
  nom        : string
  prenom     : string
  created_at : string
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthUser } catch { return null }
}

function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function fetchMe(token: string): Promise<AuthUser> {
  const { data } = await authApi.get<AuthUser>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function login(email: string, password: string): Promise<AuthUser> {
  try {
    const { data } = await authApi.post<{ access_token: string }>('/auth/login', { email, password })
    const user = await fetchMe(data.access_token)
    saveSession(data.access_token, user)
    return user
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.detail ?? 'Erreur de connexion'
      toast.error(typeof msg === 'string' ? msg : 'Email ou mot de passe incorrect.')
    }
    throw err
  }
}

export async function register(
  email: string, password: string, nom: string, prenom: string,
): Promise<AuthUser> {
  try {
    const { data } = await authApi.post<{ access_token: string }>('/auth/register', {
      email, password, nom, prenom,
    })
    const user = await fetchMe(data.access_token)
    saveSession(data.access_token, user)
    return user
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.detail ?? "Erreur lors de l'inscription"
      toast.error(typeof msg === 'string' ? msg : "Erreur lors de l'inscription")
    }
    throw err
  }
}

export async function getUserStats(): Promise<{
  total_evaluations: number
  avg_risk_score   : number
  user             : AuthUser
}> {
  const token = getToken()
  if (!token) throw new Error('Non authentifié')
  const { data } = await authApi.get('/auth/stats', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function getHistory(): Promise<Array<{
  id            : number
  risk_score    : number
  classification: string
  patient_data  : Record<string, number> | null
  created_at    : string
}>> {
  const token = getToken()
  if (!token) throw new Error('Non authentifié')
  const { data } = await authApi.get('/auth/history', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}

export async function deleteAccount(): Promise<void> {
  const token = getToken()
  if (!token) throw new Error('Non authentifié')
  await authApi.delete('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  logout()
}
