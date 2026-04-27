# -*- coding: utf-8 -*-
from fastapi import APIRouter
from app.models.schemas import PatientData

router = APIRouter()


def build_recommendations(data: dict, classification: str) -> list:
    recs = []
    bmi = int(data.get("BMI", 0))

    # BMI
    if data.get("BMI", 0) >= 25:
        recs.append(
            f"Adoptez une alimentation équilibrée et réduisez les aliments ultra-transformés "
            f"pour atteindre un IMC sain (IMC actuel estimé : {bmi})."
        )
    else:
        recs.append(
            "Maintenez votre poids actuel avec une alimentation variée et équilibrée."
        )

    # Physical activity
    if data.get("PhysActivity", 1) == 0:
        recs.append(
            "Pratiquez au moins 150 minutes d'activité physique modérée par semaine "
            "(marche rapide, vélo, natation) pour réduire significativement le risque."
        )
    else:
        recs.append(
            "Continuez votre activité physique régulière et augmentez progressivement l'intensité."
        )

    # Blood pressure / Cholesterol
    if data.get("HighBP", 0) == 1 or data.get("HighChol", 0) == 1:
        recs.append(
            "Surveillez régulièrement votre tension artérielle et votre cholestérol. "
            "Réduisez le sel, les graisses saturées et consultez votre médecin."
        )
    else:
        recs.append(
            "Faites un bilan cardio-métabolique annuel pour surveiller tension et cholestérol."
        )

    # Fruits / Veggies
    if data.get("Fruits", 1) == 0 or data.get("Veggies", 1) == 0:
        recs.append(
            "Augmentez votre consommation de fruits et légumes (au moins 5 portions/jour) "
            "pour apporter fibres et micronutriments protecteurs."
        )
    else:
        recs.append(
            "Votre consommation de fruits et légumes est bonne. Privilégiez aussi les légumineuses."
        )

    # Alcohol / Smoker
    if data.get("HvyAlcoholConsump", 0) == 1 or data.get("Smoker", 0) == 1:
        recs.append(
            "Envisagez d'arrêter de fumer. Le tabac augmente de 30 à 40 % le risque "
            "de diabète de type 2 et aggrave les complications cardiovasculaires."
        )
    else:
        recs.append(
            "Évitez le tabac et limitez l'alcool pour préserver votre santé métabolique."
        )

    # If diabetic or pre-diabetic, replace last rec with medical consultation
    if classification in ("Diabetique", "Pre-diabetique"):
        recs[-1] = (
            "Consultez un médecin ou un endocrinologue pour un bilan glycémique complet "
            "(glycémie à jeun, HbA1c) et un suivi personnalisé."
        )

    return recs[:5]


@router.post("/recommend")
def recommend(patient: PatientData):
    data = patient.model_dump()
    recs = build_recommendations(data, classification="")
    return {"recommendations": recs}
