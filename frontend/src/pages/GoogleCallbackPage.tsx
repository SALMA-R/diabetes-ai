import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heart, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const TOKEN_KEY = 'diabetes_ai_token'
const USER_KEY  = 'diabetes_ai_user'

export default function GoogleCallbackPage() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error || !token) {
      toast.error('La connexion Google a échoué. Réessayez.')
      navigate('/auth')
      return
    }

    // Stocker le token (même clé que la connexion classique)
    localStorage.setItem(TOKEN_KEY, token)

    // Récupérer les infos utilisateur depuis /auth/me
    fetch('http://localhost:8000/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        toast.success(`Bienvenue, ${user.prenom} !`)
        navigate('/')
      })
      .catch(() => {
        // Token valide mais /me a échoué : on redirige quand même
        toast.success('Connecté avec Google !')
        navigate('/')
      })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F0FFF8] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 bg-[#00A86B] rounded-2xl flex items-center justify-center mx-auto">
          <Heart className="w-7 h-7 text-white fill-white" />
        </div>
        <div className="flex items-center justify-center gap-2 text-[#64748B]">
          <Loader2 className="w-5 h-5 animate-spin text-[#00A86B]" />
          <span className="font-medium">Connexion Google en cours…</span>
        </div>
      </div>
    </div>
  )
}
