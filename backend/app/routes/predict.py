# -*- coding: utf-8 -*-
from fastapi import APIRouter, HTTPException
from app.models.schemas import PatientData, PredictionResult
from app.services.ml_service import ml_service
from app.routes.recommend import build_recommendations

router = APIRouter()


@router.post("/predict", response_model=PredictionResult)
def predict(patient: PatientData):
    try:
        data = patient.model_dump()
        pred = ml_service.predict(data)

        risk   = pred["risk_score"]
        label  = pred["classification"]

        messages = {
            "Normal"         : "Votre profil ne présente pas de risque élevé de diabète.",
            "Pre-diabetique" : "Votre profil présente un risque modéré. Adoptez de bonnes habitudes.",
            "Diabetique"     : "Risque élevé détecté. Consultez un médecin rapidement.",
        }

        recommendations = build_recommendations(data, label)

        return PredictionResult(
            risk_score      = risk,
            classification  = label,
            top_3_factors   = pred["top_3_factors"],
            message         = messages[label],
            recommendations = recommendations,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
