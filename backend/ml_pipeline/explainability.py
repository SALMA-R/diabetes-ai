# -*- coding: utf-8 -*-
"""
SHAP Explainability - CDC Diabetes XGBoost model
Generates global + local explanations and expose explain_patient()
"""

import os
import json
import numpy as np
import joblib
import shap
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# ------------------------------------------------------------------ paths ---
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR   = os.path.join(BASE_DIR, 'data', 'processed')
MODELS_DIR = os.path.join(BASE_DIR, 'backend', 'ml_pipeline', 'models')
os.makedirs(DATA_DIR, exist_ok=True)

FEATURE_NAMES = [
    'HighBP', 'HighChol', 'CholCheck', 'BMI', 'Smoker',
    'Stroke', 'HeartDiseaseorAttack', 'PhysActivity',
    'Fruits', 'Veggies', 'HvyAlcoholConsump', 'AnyHealthcare',
    'NoDocbcCost', 'GenHlth', 'MentHlth', 'PhysHlth',
    'DiffWalk', 'Sex', 'Age', 'Education', 'Income'
]

# ----------------------------------------------------------- 1. load data ---
print('=' * 60)
print('  SHAP EXPLAINABILITY - CDC Diabetes XGBoost')
print('=' * 60)

model   = joblib.load(os.path.join(MODELS_DIR, 'best_model.pkl'))
X_test  = np.load(os.path.join(DATA_DIR, 'X_test_cdc.npy'))
y_test  = np.load(os.path.join(DATA_DIR, 'y_test_cdc.npy'))

print(f'\n[1] Modele charge  : {type(model).__name__}')
print(f'    X_test shape   : {X_test.shape}')
print(f'    Positifs (1)   : {int(y_test.sum())} / {len(y_test)}')

# ----------------------------------------- 2. SHAP TreeExplainer (100 pts) --
print('\n[2] Calcul SHAP values (100 premiers exemples)...')

explainer   = shap.TreeExplainer(model)
X_sample    = X_test[:100]
shap_values = explainer(X_sample)        # Explanation object (shap >= 0.41)

print('    SHAP values calcules.')

# --------------------------------------------------------- 3. save plots ---
def save(fig_path):
    plt.savefig(fig_path, dpi=150, bbox_inches='tight')
    plt.close()
    print(f'    Sauvegarde -> {os.path.relpath(fig_path, BASE_DIR)}')


print('\n[3] Generation des graphiques...')

# -- summary plot (beeswarm) ---------------------------------------------------
plt.figure(figsize=(10, 7))
shap.summary_plot(shap_values, X_sample, feature_names=FEATURE_NAMES, show=False)
plt.title('SHAP Summary Plot - Impact global des features', fontsize=13, fontweight='bold')
save(os.path.join(DATA_DIR, 'summary_plot.png'))

# -- bar plot (top 10 mean |SHAP|) --------------------------------------------
plt.figure(figsize=(9, 6))
shap.summary_plot(shap_values, X_sample, feature_names=FEATURE_NAMES,
                  plot_type='bar', max_display=10, show=False)
plt.title('Top 10 features les plus importantes (|SHAP| moyen)', fontsize=13, fontweight='bold')
save(os.path.join(DATA_DIR, 'bar_plot.png'))

# -- waterfall patient #0 (non-diabetique si possible) ------------------------
idx_neg = int(np.where(y_test[:100] == 0)[0][0])
plt.figure(figsize=(10, 6))
shap.plots.waterfall(shap_values[idx_neg], max_display=12, show=False)
plt.title(f'Waterfall - Patient #{idx_neg} (Non-diabetique)', fontsize=12, fontweight='bold')
save(os.path.join(DATA_DIR, 'waterfall_plot_0.png'))

# -- waterfall patient diabetique ---------------------------------------------
idx_pos = int(np.where(y_test[:100] == 1)[0][0])
plt.figure(figsize=(10, 6))
shap.plots.waterfall(shap_values[idx_pos], max_display=12, show=False)
plt.title(f'Waterfall - Patient #{idx_pos} (Diabetique)', fontsize=12, fontweight='bold')
save(os.path.join(DATA_DIR, 'waterfall_plot_1.png'))

# ------------------------------------------------- 4. explain_patient() -----

def explain_patient(patient_data_dict: dict) -> dict:
    """
    Explain a single patient prediction.

    Parameters
    ----------
    patient_data_dict : dict
        Keys = FEATURE_NAMES (21 features), values = numeric.

    Returns
    -------
    dict with keys:
        risk_score        : float [0, 1]
        classification    : str
        top_3_factors     : list[dict]  {feature, shap_value, direction}
        shap_values_dict  : dict {feature: shap_value}
    """
    # build ordered array
    x = np.array([[patient_data_dict[f] for f in FEATURE_NAMES]], dtype=float)

    # risk score
    risk_score = float(model.predict_proba(x)[0, 1])

    # classification thresholds
    if risk_score < 0.30:
        classification = 'Normal'
    elif risk_score < 0.55:
        classification = 'Pre-diabetique'
    else:
        classification = 'Diabetique'

    # SHAP for this patient
    sv = explainer(x)
    shap_vals = sv.values[0]            # shape (21,)

    shap_dict = {f: round(float(v), 5) for f, v in zip(FEATURE_NAMES, shap_vals)}

    # top 3 by absolute contribution
    sorted_features = sorted(shap_dict.items(), key=lambda kv: abs(kv[1]), reverse=True)
    top_3 = [
        {
            'feature'    : feat,
            'shap_value' : val,
            'direction'  : 'augmente le risque' if val > 0 else 'reduit le risque'
        }
        for feat, val in sorted_features[:3]
    ]

    return {
        'risk_score'      : round(risk_score, 4),
        'classification'  : classification,
        'top_3_factors'   : top_3,
        'shap_values_dict': shap_dict
    }


# --------------------------------------------------------- 5. test example ---
print('\n[4] Test explain_patient()...')

example_patient = {
    'HighBP'              : 1,
    'HighChol'            : 1,
    'CholCheck'           : 1,
    'BMI'                 : 33.0,
    'Smoker'              : 0,
    'Stroke'              : 0,
    'HeartDiseaseorAttack': 0,
    'PhysActivity'        : 0,
    'Fruits'              : 1,
    'Veggies'             : 1,
    'HvyAlcoholConsump'   : 0,
    'AnyHealthcare'       : 1,
    'NoDocbcCost'         : 0,
    'GenHlth'             : 4,
    'MentHlth'            : 5,
    'PhysHlth'            : 10,
    'DiffWalk'            : 1,
    'Sex'                 : 0,
    'Age'                 : 9,
    'Education'           : 4,
    'Income'              : 3
}

result = explain_patient(example_patient)

print('\n  === RESULTAT JSON ===')
print(json.dumps(result, indent=2, ensure_ascii=False))

print(f'\n{"=" * 60}')
print(f'  Explainability termine.')
print(f'  Graphiques sauvegardes dans data/processed/')
print(f'{"=" * 60}')
