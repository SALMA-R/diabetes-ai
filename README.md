# DiabetesAI — Détection du Risque Diabétique

Application web d'évaluation du risque de diabète basée sur XGBoost + SHAP, avec authentification JWT et recommandations personnalisées.

---

## Prérequis

- **Python 3.10+**
- **Node.js 18+** et npm

---

## Installation

### 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
```

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
```

---

## Exécution

### Démarrer le Backend

```bash
cd backend
python run.py
```

Le serveur démarre sur **http://localhost:8000**  
Documentation API disponible sur **http://localhost:8000/docs**

### Démarrer le Frontend

Dans un second terminal :

```bash
cd frontend
npm run dev
```

L'application est accessible sur **http://localhost:5173**

---

## Structure du projet

```
diabetes-ai/
├── backend/
│   ├── app/
│   │   ├── main.py               # Point d'entrée FastAPI
│   │   ├── database.py           # SQLite (SQLAlchemy)
│   │   ├── models/schemas.py     # Schémas Pydantic
│   │   ├── routes/
│   │   │   ├── predict.py        # POST /predict
│   │   │   ├── recommend.py      # POST /recommend
│   │   │   ├── auth.py           # POST /auth/register, /auth/login
│   │   │   └── chat.py           # POST /chat
│   │   └── services/
│   │       ├── ml_service.py     # XGBoost + SHAP
│   │       └── auth_service.py   # JWT + bcrypt
│   ├── ml_pipeline/              # Notebooks d'entraînement
│   ├── run.py                    # Lancement uvicorn
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/                # 9 pages React
    │   ├── components/           # ProtectedRoute
    │   └── services/             # api.ts, auth.ts
    └── package.json
```

---

## Fonctionnalités

- **Prédiction XGBoost** — modèle entraîné sur 253 680 patients (AUC-ROC 0.88)
- **Explicabilité SHAP** — top 3 facteurs influents avec direction
- **Recommandations personnalisées** — 5 conseils adaptés au profil
- **Simulation What-If** — impact de changements d'habitudes
- **Chatbot médical** — agent LLaMA-3.1 en français
- **Authentification JWT** — inscription, connexion, historique personnel
- **Dashboard** — évolution du risque dans le temps

---

## Variables d'environnement

Fichier `backend/.env` :

```env
SECRET_KEY=diabetes-ai-jwt-secret-2026-pfa-s8-change-in-prod
```
