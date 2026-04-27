import { useNavigate } from 'react-router-dom'
import { Activity, Brain, Shield, ArrowRight, Users, BarChart2, Layers } from 'lucide-react'

const FEATURES = [
  {
    icon: <Activity className="w-8 h-8 text-blue-600" />,
    title: 'Prédiction IA',
    desc: 'Modèle XGBoost entraîné sur 253 680 patients réels. Résultat en quelques secondes.',
    bg: 'bg-blue-50',
  },
  {
    icon: <Brain className="w-8 h-8 text-purple-600" />,
    title: 'Explications SHAP',
    desc: 'Comprenez pourquoi le modèle prédit ce risque grâce aux 3 facteurs les plus déterminants.',
    bg: 'bg-purple-50',
  },
  {
    icon: <Shield className="w-8 h-8 text-green-600" />,
    title: 'Recommandations',
    desc: '5 conseils personnalisés basés sur votre profil pour réduire votre risque de diabète.',
    bg: 'bg-green-50',
  },
]

const STATS = [
  { icon: <Users className="w-6 h-6" />, value: '253 680', label: 'patients analysés' },
  { icon: <BarChart2 className="w-6 h-6" />, value: '82 %', label: 'AUC-ROC' },
  { icon: <Layers className="w-6 h-6" />, value: '21', label: 'indicateurs de santé' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-800 text-lg">DiabetesAI</span>
          </div>
          <button
            onClick={() => navigate('/assessment')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Commencer
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          Intelligence Artificielle · Santé
        </span>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Évaluez votre risque de&nbsp;
          <span className="text-blue-600">diabète</span>
          <br />en 2 minutes
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Un questionnaire de 21 indicateurs de santé analysé par un modèle XGBoost
          avec explications SHAP et recommandations personnalisées.
        </p>
        <button
          onClick={() => navigate('/assessment')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5"
        >
          Commencer l'évaluation
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="mt-4 text-sm text-gray-400">
          Gratuit · Anonyme · Résultat immédiat
        </p>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center text-white">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <div className="opacity-80">{s.icon}</div>
              <div className="text-3xl font-extrabold">{s.value}</div>
              <div className="text-blue-200 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Ce que l'outil fait pour vous
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className={`inline-flex p-3 rounded-xl mb-5 ${f.bg}`}>{f.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="bg-gray-900 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Prêt à connaître votre risque ?
        </h2>
        <p className="text-gray-400 mb-8">
          Le questionnaire prend moins de 2 minutes. Aucune donnée personnelle n'est conservée.
        </p>
        <button
          onClick={() => navigate('/assessment')}
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all"
        >
          Commencer l'évaluation <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      <footer className="text-center py-6 text-gray-400 text-sm">
        DiabetesAI — Projet PFA · Les résultats ne remplacent pas un avis médical.
      </footer>
    </div>
  )
}
