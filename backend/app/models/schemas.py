# -*- coding: utf-8 -*-
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# ── ML / Prediction models ────────────────────────────────────────────────────

class PatientData(BaseModel):
    # ── CDC 21 features — required, fed directly to XGBoost ──────────────────
    HighBP              : float = Field(..., ge=0, le=1,   description="Hypertension (0/1)")
    HighChol            : float = Field(..., ge=0, le=1,   description="Cholesterol eleve (0/1)")
    CholCheck           : float = Field(..., ge=0, le=1,   description="Bilan cholesterol 5 ans (0/1)")
    BMI                 : float = Field(..., ge=10, le=100, description="Indice de masse corporelle")
    Smoker              : float = Field(..., ge=0, le=1,   description="Fumeur (0/1)")
    Stroke              : float = Field(..., ge=0, le=1,   description="Antecedent AVC (0/1)")
    HeartDiseaseorAttack: float = Field(..., ge=0, le=1,   description="Maladie cardiaque (0/1)")
    PhysActivity        : float = Field(..., ge=0, le=1,   description="Activite physique 30j (0/1)")
    Fruits              : float = Field(..., ge=0, le=1,   description="Fruits 1x/jour (0/1)")
    Veggies             : float = Field(..., ge=0, le=1,   description="Legumes 1x/jour (0/1)")
    HvyAlcoholConsump   : float = Field(..., ge=0, le=1,   description="Alcool excessif (0/1)")
    AnyHealthcare       : float = Field(..., ge=0, le=1,   description="Couverture sante (0/1)")
    NoDocbcCost         : float = Field(..., ge=0, le=1,   description="Pas de medecin (cout) (0/1)")
    GenHlth             : float = Field(..., ge=1, le=5,   description="Sante generale (1=excellente, 5=mauvaise)")
    MentHlth            : float = Field(..., ge=0, le=30,  description="Jours mauvaise sante mentale")
    PhysHlth            : float = Field(..., ge=0, le=30,  description="Jours mauvaise sante physique")
    DiffWalk            : float = Field(..., ge=0, le=1,   description="Difficulte marcher (0/1)")
    Sex                 : float = Field(..., ge=0, le=1,   description="Sexe (0=femme, 1=homme)")
    Age                 : float = Field(..., ge=1, le=13,  description="Tranche age (1=18-24 ... 13=80+)")
    Education           : float = Field(default=5, ge=1, le=6, description="Niveau education (1-6)")
    Income              : float = Field(default=5, ge=1, le=8, description="Revenu annuel")

    # ── Extended lifestyle features — optional, used for personalised recs ───
    sleep_hours         : float = Field(default=7.0, ge=4,  le=12,  description="Heures de sommeil/nuit")
    sleep_disorders     : int   = Field(default=0,   ge=0,  le=1,   description="Troubles du sommeil (0/1)")
    homemade_meals_week : int   = Field(default=14,  ge=0,  le=21,  description="Repas maison par semaine")
    sugary_drinks       : int   = Field(default=1,   ge=0,  le=3,   description="Boissons sucrées (0=jamais..3=quotidien)")
    stress_level        : int   = Field(default=2,   ge=1,  le=5,   description="Niveau de stress (1=tres faible, 5=tres eleve)")
    relaxation_practice : int   = Field(default=0,   ge=0,  le=1,   description="Pratique de relaxation (0/1)")
    family_diabetes     : int   = Field(default=0,   ge=0,  le=2,   description="Antecedents familiaux diabete (0=aucun, 1=un parent, 2=les deux)")
    family_heart        : int   = Field(default=0,   ge=0,  le=1,   description="Antecedents familiaux cardiaques (0/1)")
    water_glasses       : float = Field(default=6.0, ge=0,  le=12,  description="Verres d'eau par jour")
    sedentary_hours     : float = Field(default=6.0, ge=0,  le=16,  description="Heures sedentaires par jour")
    ultra_processed     : int   = Field(default=0,   ge=0,  le=3,   description="Produits ultra-transformés (0=rarement, 3=très souvent)")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "HighBP": 1, "HighChol": 1, "CholCheck": 1, "BMI": 32.0,
            "Smoker": 0, "Stroke": 0, "HeartDiseaseorAttack": 0,
            "PhysActivity": 0, "Fruits": 1, "Veggies": 1,
            "HvyAlcoholConsump": 0, "AnyHealthcare": 1, "NoDocbcCost": 0,
            "GenHlth": 4, "MentHlth": 5, "PhysHlth": 10,
            "DiffWalk": 1, "Sex": 0, "Age": 9, "Education": 4, "Income": 3,
        }
    })


class SHAPFactor(BaseModel):
    feature        : str
    shap_value     : float
    direction      : str
    shap_direction : str  # "positive" | "negative"


class PredictionResult(BaseModel):
    risk_score      : float
    classification  : str
    top_3_factors   : List[SHAPFactor]
    message         : str
    recommendations : List[str]


class ChatMessage(BaseModel):
    message        : str
    patient_context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str


# ── Auth models ───────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email   : str
    password: str = Field(..., min_length=6, description="Mot de passe (6 caractères min)")
    nom     : str = Field(..., min_length=1)
    prenom  : str = Field(..., min_length=1)


class UserLogin(BaseModel):
    email   : str
    password: str


class UserResponse(BaseModel):
    id        : int
    email     : str
    nom       : str
    prenom    : str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type  : str = "bearer"
