"""
Preprocessing pipeline — CDC Diabetes Health Indicators
Split stratifie 70/15/15 + SMOTE sur train + StandardScaler
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE

# ─── Chemins ────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_RAW    = os.path.join(BASE_DIR, 'data', 'raw',       'cdc_diabetes.csv')
DATA_OUT    = os.path.join(BASE_DIR, 'data', 'processed')
MODELS_OUT  = os.path.join(BASE_DIR, 'backend', 'ml_pipeline', 'models')

os.makedirs(DATA_OUT,   exist_ok=True)
os.makedirs(MODELS_OUT, exist_ok=True)

# ─── 1. Chargement ──────────────────────────────────────────────────────────
print('=' * 55)
print('  PREPROCESSING — CDC Diabetes Health Indicators')
print('=' * 55)

df = pd.read_csv(DATA_RAW)
print(f'\n[1] Dataset charge : {df.shape[0]:,} lignes × {df.shape[1]} colonnes')

# ─── 2. Separation X / y ────────────────────────────────────────────────────
TARGET = 'Diabetes_binary'
X = df.drop(columns=[TARGET]).values
y = df[TARGET].values
feature_names = df.drop(columns=[TARGET]).columns.tolist()

print(f'[2] Features (X) : {X.shape[1]} colonnes')
counts_y = np.bincount(y.astype(int))
print(f'    Cible    (y) : {counts_y} -> '
      f'{counts_y[0]:,} non-diabetiques / '
      f'{counts_y[1]:,} diabetiques')

# ─── 3. Split stratifie 70 / 15 / 15 ────────────────────────────────────────
# Étape 1 : 70% train — 30% temp
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y,
    test_size=0.30,
    random_state=42,
    stratify=y
)

# Étape 2 : 50% de temp -> val (15%) / 50% -> test (15%)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp,
    test_size=0.50,
    random_state=42,
    stratify=y_temp
)

print(f'\n[3] Split stratifie 70/15/15 :')
print(f'    Train : {X_train.shape[0]:>7,} echantillons  '
      f'(diabetiques : {y_train.sum():,} — {y_train.mean()*100:.1f}%)')
print(f'    Val   : {X_val.shape[0]:>7,} echantillons  '
      f'(diabetiques : {y_val.sum():,} — {y_val.mean()*100:.1f}%)')
print(f'    Test  : {X_test.shape[0]:>7,} echantillons  '
      f'(diabetiques : {y_test.sum():,} — {y_test.mean()*100:.1f}%)')

# ─── 4. StandardScaler (fitte sur train uniquement) ──────────────────────────
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled   = scaler.transform(X_val)
X_test_scaled  = scaler.transform(X_test)

print(f'\n[4] StandardScaler applique (fit sur train uniquement)')

# ─── 5. SMOTE sur X_train uniquement ────────────────────────────────────────
print(f'\n[5] SMOTE — avant : {np.bincount(y_train.astype(int))}')

smote = SMOTE(random_state=42, k_neighbors=5)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)

print(f'         apres  : {np.bincount(y_train_resampled.astype(int))} '
      f'-> {len(X_train_resampled):,} echantillons equilibres (50/50)')

# ─── 6. Sauvegarde des splits ────────────────────────────────────────────────
splits = {
    'X_train_cdc': X_train_resampled,
    'X_val_cdc':   X_val_scaled,
    'X_test_cdc':  X_test_scaled,
    'y_train_cdc': y_train_resampled,
    'y_val_cdc':   y_val,
    'y_test_cdc':  y_test,
}

for name, array in splits.items():
    path = os.path.join(DATA_OUT, f'{name}.npy')
    np.save(path, array)

print(f'\n[6] Fichiers .npy sauvegardes -> data/processed/')

# ─── 7. Sauvegarde du scaler ─────────────────────────────────────────────────
scaler_path = os.path.join(MODELS_OUT, 'scaler_cdc.pkl')
joblib.dump(scaler, scaler_path)
print(f'[7] Scaler sauvegarde -> backend/ml_pipeline/models/scaler_cdc.pkl')

# ─── 8. Resume final ─────────────────────────────────────────────────────────
print('\n' + '=' * 55)
print('  SHAPES FINALES')
print('=' * 55)
print(f'  X_train (apres SMOTE) : {X_train_resampled.shape}')
print(f'  y_train (apres SMOTE) : {y_train_resampled.shape}')
print(f'  X_val                 : {X_val_scaled.shape}')
print(f'  y_val                 : {y_val.shape}')
print(f'  X_test                : {X_test_scaled.shape}')
print(f'  y_test                : {y_test.shape}')
print(f'  Nombre de features    : {X.shape[1]}')
print(f'  Features              : {feature_names}')
print('\n  Preprocessing CDC termine avec succes.')
print('=' * 55)

# ─── Note : alternative sans SMOTE ──────────────────────────────────────────
# Pour utiliser class_weight='balanced' à la place de SMOTE :
#   - Ne pas appliquer le SMOTE ci-dessus
#   - Passer class_weight='balanced' lors de l'entraînement du modele :
#       LogisticRegression(class_weight='balanced')
#       RandomForestClassifier(class_weight='balanced')
#   - Pour XGBoost : scale_pos_weight = n_negatifs / n_positifs ≈ 6.18
