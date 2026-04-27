# -*- coding: utf-8 -*-
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class PatientData(BaseModel):
    HighBP              : float = Field(..., ge=0, le=1,  description="Hypertension (0/1)")
    HighChol            : float = Field(..., ge=0, le=1,  description="Cholesterol eleve (0/1)")
    CholCheck           : float = Field(..., ge=0, le=1,  description="Bilan cholesterol 5 ans (0/1)")
    BMI                 : float = Field(..., ge=10, le=100, description="Indice de masse corporelle")
    Smoker              : float = Field(..., ge=0, le=1,  description="Fumeur (0/1)")
    Stroke              : float = Field(..., ge=0, le=1,  description="Antecedent AVC (0/1)")
    HeartDiseaseorAttack: float = Field(..., ge=0, le=1,  description="Maladie cardiaque (0/1)")
    PhysActivity        : float = Field(..., ge=0, le=1,  description="Activite physique 30j (0/1)")
    Fruits              : float = Field(..., ge=0, le=1,  description="Fruits 1x/jour (0/1)")
    Veggies             : float = Field(..., ge=0, le=1,  description="Legumes 1x/jour (0/1)")
    HvyAlcoholConsump   : float = Field(..., ge=0, le=1,  description="Alcool excessif (0/1)")
    AnyHealthcare       : float = Field(..., ge=0, le=1,  description="Couverture sante (0/1)")
    NoDocbcCost         : float = Field(..., ge=0, le=1,  description="Pas de medecin (cout) (0/1)")
    GenHlth             : float = Field(..., ge=1, le=5,  description="Sante generale (1=excellente, 5=mauvaise)")
    MentHlth            : float = Field(..., ge=0, le=30, description="Jours mauvaise sante mentale")
    PhysHlth            : float = Field(..., ge=0, le=30, description="Jours mauvaise sante physique")
    DiffWalk            : float = Field(..., ge=0, le=1,  description="Difficulte marcher (0/1)")
    Sex                 : float = Field(..., ge=0, le=1,  description="Sexe (0=femme, 1=homme)")
    Age                 : float = Field(..., ge=1, le=13, description="Tranche age (1=18-24 ... 13=80+)")
    Education           : float = Field(default=5, ge=1, le=6, description="Niveau education (1-6)")
    Income              : float = Field(default=5, ge=1, le=8, description="Revenu annuel (1=<10k ... 8=>75k)")

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
