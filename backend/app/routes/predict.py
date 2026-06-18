# -*- coding: utf-8 -*-
import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.models.schemas import PatientData, PredictionResult
from app.services.ml_service import ml_service
from app.services.auth_service import get_optional_user
from app.database import get_db, Prediction, User
from app.routes.recommend import build_recommendations

router = APIRouter()


@router.post("/predict", response_model=PredictionResult)
def predict(
    patient: PatientData,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    try:
        data  = patient.model_dump()
        pred  = ml_service.predict(data)   # uses only the 21 CDC features internally
        risk  = pred["risk_score"]
        label = pred["classification"]

        messages = {
            "Normal"        : "Votre profil ne présente pas de risque élevé de diabète.",
            "Pre-diabetique": "Votre profil présente un risque modéré. Adoptez de bonnes habitudes.",
            "Diabetique"    : "Risque élevé détecté. Consultez un médecin rapidement.",
        }

        recommendations = build_recommendations(data, label)

        # Persist to DB when user is authenticated
        if current_user:
            db.add(Prediction(
                user_id        = current_user.id,
                risk_score     = risk,
                classification = label,
                patient_data   = json.dumps(data),
            ))
            db.commit()

        return PredictionResult(
            risk_score      = risk,
            classification  = label,
            top_3_factors   = pred["top_3_factors"],
            message         = messages[label],
            recommendations = recommendations,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
