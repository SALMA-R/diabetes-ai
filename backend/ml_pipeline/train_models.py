# -*- coding: utf-8 -*-
"""
Training pipeline - CDC Diabetes Health Indicators
Models: Logistic Regression | Random Forest | XGBoost
"""

import os
import time
import numpy as np
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, roc_auc_score, f1_score,
    precision_score, recall_score, confusion_matrix
)
from xgboost import XGBClassifier

# ------------------------------------------------------------------ paths ---
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR   = os.path.join(BASE_DIR, 'data', 'processed')
MODELS_DIR = os.path.join(BASE_DIR, 'backend', 'ml_pipeline', 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

# ----------------------------------------------------------- 1. load data ---
print('=' * 60)
print('  TRAINING PIPELINE - CDC Diabetes Health Indicators')
print('=' * 60)

X_train = np.load(os.path.join(DATA_DIR, 'X_train_cdc.npy'))
X_val   = np.load(os.path.join(DATA_DIR, 'X_val_cdc.npy'))
X_test  = np.load(os.path.join(DATA_DIR, 'X_test_cdc.npy'))
y_train = np.load(os.path.join(DATA_DIR, 'y_train_cdc.npy'))
y_val   = np.load(os.path.join(DATA_DIR, 'y_val_cdc.npy'))
y_test  = np.load(os.path.join(DATA_DIR, 'y_test_cdc.npy'))

print(f'\n[1] Donnees chargees :')
print(f'    X_train : {X_train.shape}  (apres SMOTE)')
print(f'    X_val   : {X_val.shape}')
print(f'    X_test  : {X_test.shape}')

# ------------------------------------------------------- 2. model helpers ---
def evaluate(model, X, y, split_name='Val'):
    y_pred  = model.predict(X)
    y_proba = model.predict_proba(X)[:, 1]
    metrics = {
        'Accuracy'  : accuracy_score(y, y_pred),
        'AUC-ROC'   : roc_auc_score(y, y_proba),
        'F1-Score'  : f1_score(y, y_pred),
        'Precision' : precision_score(y, y_pred),
        'Recall'    : recall_score(y, y_pred),
    }
    cm = confusion_matrix(y, y_pred)
    print(f'\n  --- Resultats {split_name} set ---')
    for k, v in metrics.items():
        print(f'    {k:<12}: {v:.4f}')
    print(f'\n  Matrice de confusion ({split_name}) :')
    print(f'    TN={cm[0,0]:>6}  FP={cm[0,1]:>6}')
    print(f'    FN={cm[1,0]:>6}  TP={cm[1,1]:>6}')
    return metrics


def train_and_eval(name, model):
    print(f'\n{"=" * 60}')
    print(f'  MODELE : {name}')
    print(f'{"=" * 60}')
    t0 = time.time()
    model.fit(X_train, y_train)
    elapsed = time.time() - t0
    print(f'  Entrainement termine en {elapsed:.1f}s')
    metrics = evaluate(model, X_val, y_val, split_name='Validation')
    return model, metrics

# ---------------------------------------------------- 3. train 3 models ----
models_config = [
    (
        'Logistic Regression',
        LogisticRegression(
            max_iter=1000,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
    ),
    (
        'Random Forest',
        RandomForestClassifier(
            n_estimators=100,
            class_weight='balanced',
            n_jobs=-1,
            random_state=42
        )
    ),
    (
        'XGBoost',
        XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            scale_pos_weight=6,
            random_state=42,
            eval_metric='logloss',
            verbosity=0
        )
    ),
]

results = {}
trained = {}

for name, model in models_config:
    fitted_model, metrics = train_and_eval(name, model)
    results[name]  = metrics
    trained[name]  = fitted_model

# ----------------------------------------- 4. comparative summary table ----
print(f'\n{"=" * 60}')
print('  TABLEAU COMPARATIF - VAL SET')
print(f'{"=" * 60}')
header = f"  {'Modele':<24} {'Accuracy':>9} {'AUC-ROC':>9} {'F1':>9} {'Precision':>10} {'Recall':>9}"
print(header)
print('  ' + '-' * 56)
for name, m in results.items():
    print(
        f"  {name:<24} "
        f"{m['Accuracy']:>9.4f} "
        f"{m['AUC-ROC']:>9.4f} "
        f"{m['F1-Score']:>9.4f} "
        f"{m['Precision']:>10.4f} "
        f"{m['Recall']:>9.4f}"
    )

# -------------------------------------------- 5. best model by AUC-ROC ----
best_name = max(results, key=lambda n: results[n]['AUC-ROC'])
best_model = trained[best_name]
best_auc   = results[best_name]['AUC-ROC']

print(f'\n[5] Meilleur modele (AUC-ROC) : {best_name}  ({best_auc:.4f})')

# Evaluate best model on test set
print(f'\n  === Evaluation finale sur TEST SET ===')
evaluate(best_model, X_test, y_test, split_name='Test')

# Save best model under both names
best_path = os.path.join(MODELS_DIR, 'best_model.pkl')
xgb_path  = os.path.join(MODELS_DIR, 'xgboost_model.pkl')

joblib.dump(best_model, best_path)
joblib.dump(trained['XGBoost'], xgb_path)

# Also save all models individually
for name, model in trained.items():
    slug = name.lower().replace(' ', '_')
    joblib.dump(model, os.path.join(MODELS_DIR, f'{slug}.pkl'))

print(f'\n[6] Modeles sauvegardes -> backend/ml_pipeline/models/')
print(f'    best_model.pkl      ({best_name})')
print(f'    xgboost_model.pkl')
print(f'    logistic_regression.pkl')
print(f'    random_forest.pkl')

print(f'\n{"=" * 60}')
print(f'  Meilleur modele : {best_name} avec AUC-ROC = {best_auc:.4f}')
print(f'{"=" * 60}')
