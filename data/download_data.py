import subprocess
import os
import pandas as pd

# 1. Download dataset via Kaggle API
print("Téléchargement du dataset PIMA...")
result = subprocess.run(
    [
        "kaggle", "datasets", "download",
        "-d", "uciml/pima-indians-diabetes-database",
        "-p", "data/raw/",
        "--unzip"
    ],
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print("Erreur Kaggle:", result.stderr)
    exit(1)
else:
    print(result.stdout)

# 2. Verify file exists
csv_path = "data/raw/diabetes.csv"
if not os.path.exists(csv_path):
    print(f"ERREUR : fichier non trouvé → {csv_path}")
    exit(1)
print(f"Fichier trouvé : {csv_path}")

# 3. Load and inspect
df = pd.read_csv(csv_path)

print("\n--- Shape ---")
print(f"{df.shape[0]} lignes, {df.shape[1]} colonnes")

print("\n--- 5 premières lignes ---")
print(df.head())

print("\n--- Colonnes ---")
print(df.columns.tolist())

print("\n--- Distribution Outcome ---")
counts = df["Outcome"].value_counts()
print(f"Non-diabétiques (0) : {counts[0]}")
print(f"Diabétiques     (1) : {counts[1]}")
print(f"Taux de diabète     : {counts[1] / len(df) * 100:.1f}%")
