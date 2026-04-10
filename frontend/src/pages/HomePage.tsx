export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-medical-blue">
          Agent Intelligent - Détection du Risque Diabétique
        </h1>
        <p className="text-gray-600 text-lg">
          Évaluez votre risque de diabète grâce à l'intelligence artificielle
        </p>
        <button className="bg-health-green hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors">
          Commencer l'évaluation
        </button>
      </div>
    </div>
  )
}
