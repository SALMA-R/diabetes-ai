# -*- coding: utf-8 -*-
"""
MLService - loads model + scaler once at startup, exposes predict + SHAP
"""

import os
import numpy as np
import joblib
import shap

FEATURE_NAMES = [
    'HighBP', 'HighChol', 'CholCheck', 'BMI', 'Smoker',
    'Stroke', 'HeartDiseaseorAttack', 'PhysActivity',
    'Fruits', 'Veggies', 'HvyAlcoholConsump', 'AnyHealthcare',
    'NoDocbcCost', 'GenHlth', 'MentHlth', 'PhysHlth',
    'DiffWalk', 'Sex', 'Age', 'Education', 'Income'
]

_BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_MODELS_DIR = os.path.join(_BASE, 'ml_pipeline', 'models')


class MLService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def load(self):
        if self._loaded:
            return
        model_path  = os.path.join(_MODELS_DIR, 'best_model.pkl')
        scaler_path = os.path.join(_MODELS_DIR, 'scaler_cdc.pkl')
        self.model      = joblib.load(model_path)
        self.scaler     = joblib.load(scaler_path)
        self.explainer  = shap.TreeExplainer(self.model)
        self._loaded    = True
        print(f'[MLService] Model loaded: {type(self.model).__name__}')

    # ---------------------------------------------------------------- predict
    def predict(self, patient_dict: dict) -> dict:
        x_raw    = np.array([[patient_dict[f] for f in FEATURE_NAMES]], dtype=float)
        x_scaled = self.scaler.transform(x_raw)
        risk     = float(self.model.predict_proba(x_scaled)[0, 1])

        if risk < 0.30:
            classification = 'Normal'
        elif risk < 0.60:
            classification = 'Pre-diabetique'
        else:
            classification = 'Diabetique'

        top3 = self.get_shap_explanation(patient_dict)

        return {
            'risk_score'    : round(risk, 4),
            'classification': classification,
            'top_3_factors' : top3,
        }

    # --------------------------------------------------------- shap top-3
    def get_shap_explanation(self, patient_dict: dict) -> list:
        x_raw    = np.array([[patient_dict[f] for f in FEATURE_NAMES]], dtype=float)
        x_scaled = self.scaler.transform(x_raw)
        sv       = self.explainer(x_scaled)
        vals     = sv.values[0]

        pairs = sorted(
            zip(FEATURE_NAMES, vals),
            key=lambda kv: abs(kv[1]),
            reverse=True
        )
        return [
            {
                'feature'        : feat,
                'shap_value'     : round(float(v), 5),
                'direction'      : 'augmente le risque' if v > 0 else 'reduit le risque',
                'shap_direction' : 'positive' if v > 0 else 'negative',
            }
            for feat, v in pairs[:3]
        ]


# singleton
ml_service = MLService()
