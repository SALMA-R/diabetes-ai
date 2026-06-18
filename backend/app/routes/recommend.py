# -*- coding: utf-8 -*-
from fastapi import APIRouter
from app.models.schemas import PatientData

router = APIRouter()


def build_recommendations(data: dict, classification: str) -> list:
    recs = []
    bmi              = int(data.get("BMI", 0))
    sleep_hours      = data.get("sleep_hours",      7.0)
    sleep_disorders  = data.get("sleep_disorders",  0)
    stress_level     = data.get("stress_level",     2)
    family_diabetes  = data.get("family_diabetes",  0)
    sedentary_hours  = data.get("sedentary_hours",  6.0)
    water_glasses    = data.get("water_glasses",    6.0)
    sugary_drinks    = data.get("sugary_drinks",    1)

    # 1 ── Alimentation / BMI
    if data.get("BMI", 0) >= 30:
        recs.append(
            f"Votre IMC de {bmi} indique une obésité. Adoptez une alimentation pauvre en sucres "
            f"raffinés et en graisses saturées, et consultez un nutritionniste."
        )
    elif data.get("BMI", 0) >= 25:
        recs.append(
            f"Adoptez une alimentation équilibrée pour atteindre un IMC sain (IMC actuel : {bmi}). "
            f"Privilégiez les légumineuses, les céréales complètes et les protéines maigres."
        )
    elif sugary_drinks >= 2:
        recs.append(
            "Réduisez votre consommation de boissons sucrées et de sodas. "
            "Une boisson sucrée par jour augmente le risque de diabète de type 2 de 18 %."
        )
    else:
        recs.append(
            "Maintenez votre poids actuel avec une alimentation variée, riche en fibres "
            "et pauvre en sucres ajoutés."
        )

    # 2 ── Activité physique / Sédentarité
    if sedentary_hours > 8:
        recs.append(
            f"Vous êtes assis environ {sedentary_hours:.0f} h/jour. Prenez une pause active toutes "
            f"les heures (marche de 5 min) et pratiquez 150 min d'activité modérée par semaine."
        )
    elif data.get("PhysActivity", 1) == 0:
        recs.append(
            "Pratiquez au moins 150 minutes d'activité physique modérée par semaine "
            "(marche rapide, vélo, natation) pour réduire significativement le risque de diabète."
        )
    else:
        recs.append(
            "Continuez votre activité physique régulière et augmentez progressivement l'intensité. "
            "Visez 30 min/jour au moins 5 jours par semaine."
        )

    # 3 ── Tension / Cholestérol / Hydratation
    if data.get("HighBP", 0) == 1 or data.get("HighChol", 0) == 1:
        recs.append(
            "Surveillez régulièrement votre tension artérielle et votre cholestérol. "
            "Réduisez le sel, les graisses saturées et consultez votre médecin pour un suivi."
        )
    elif water_glasses < 4:
        recs.append(
            f"Votre hydratation est insuffisante ({water_glasses:.0f} verre(s)/jour). "
            f"Boire 8 verres d'eau par jour améliore le métabolisme du glucose."
        )
    else:
        recs.append(
            "Faites un bilan cardio-métabolique annuel pour surveiller tension et cholestérol. "
            "Continuez à bien vous hydrater (8 verres d'eau par jour)."
        )

    # 4 ── Sommeil / Fruits & Légumes
    if sleep_hours < 6 or sleep_disorders == 1:
        recs.append(
            f"Votre sommeil est insuffisant ({sleep_hours:.0f} h/nuit). "
            f"Un sommeil de 7-9 h réduit le risque de diabète de type 2 de 25 %. "
            f"Consultez votre médecin si vous souffrez d'insomnie."
        )
    elif data.get("Fruits", 1) == 0 or data.get("Veggies", 1) == 0:
        recs.append(
            "Augmentez votre consommation de fruits et légumes (au moins 5 portions/jour) "
            "pour apporter fibres et micronutriments protecteurs contre le diabète."
        )
    else:
        recs.append(
            "Votre alimentation semble équilibrée. Privilégiez aussi les légumineuses, "
            "les noix et les céréales complètes."
        )

    # 5 ── Antécédents familiaux / Stress / Tabac / Alcool / Consultation
    if family_diabetes >= 1:
        parent_str = "un de vos parents est" if family_diabetes == 1 else "vos deux parents sont"
        recs.append(
            f"Attention : {parent_str} diabétique(s). Ce facteur génétique double votre risque. "
            f"Faites un dépistage glycémique (glycémie à jeun) chaque année."
        )
    elif stress_level >= 4:
        recs.append(
            "Votre niveau de stress élevé augmente le cortisol et favorise l'insulinorésistance. "
            "Pratiquez la méditation, le yoga ou la cohérence cardiaque (5-10 min/jour)."
        )
    elif data.get("HvyAlcoholConsump", 0) == 1 or data.get("Smoker", 0) == 1:
        recs.append(
            "Envisagez d'arrêter de fumer. Le tabac augmente de 30 à 40 % le risque de diabète "
            "de type 2 et aggrave les complications cardiovasculaires."
        )
    else:
        recs.append(
            "Évitez le tabac et limitez l'alcool pour préserver votre santé métabolique à long terme."
        )

    # Si diabétique ou pré-diabétique → remplacer la dernière reco par consultation médicale
    if classification in ("Diabetique", "Pre-diabetique"):
        recs[-1] = (
            "Consultez un médecin ou un endocrinologue pour un bilan glycémique complet "
            "(glycémie à jeun, HbA1c) et un suivi personnalisé adapté à votre profil."
        )

    return recs[:5]


@router.post("/recommend")
def recommend(patient: PatientData):
    data = patient.model_dump()
    recs = build_recommendations(data, classification="")
    return {"recommendations": recs}
