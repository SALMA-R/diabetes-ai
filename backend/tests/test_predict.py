from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

HEALTHY = {
    "HighBP": 0, "HighChol": 0, "CholCheck": 1,
    "BMI": 22, "Smoker": 0, "Stroke": 0,
    "HeartDiseaseorAttack": 0, "PhysActivity": 1,
    "Fruits": 1, "Veggies": 1, "HvyAlcoholConsump": 0,
    "AnyHealthcare": 1, "NoDocbcCost": 0, "GenHlth": 2,
    "MentHlth": 0, "PhysHlth": 0, "DiffWalk": 0,
    "Sex": 0, "Age": 5, "Education": 5, "Income": 5,
}

HIGH_RISK = {
    "HighBP": 1, "HighChol": 1, "CholCheck": 1,
    "BMI": 40, "Smoker": 1, "Stroke": 1,
    "HeartDiseaseorAttack": 1, "PhysActivity": 0,
    "Fruits": 0, "Veggies": 0, "HvyAlcoholConsump": 1,
    "AnyHealthcare": 0, "NoDocbcCost": 1, "GenHlth": 5,
    "MentHlth": 20, "PhysHlth": 20, "DiffWalk": 1,
    "Sex": 1, "Age": 10, "Education": 2, "Income": 2,
}

VALID_CLASSIFICATIONS = {"Normal", "Pre-diabetique", "Diabetique"}


def test_predict_normal():
    response = client.post("/predict", json=HEALTHY)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["risk_score"] <= 1
    assert data["classification"] in VALID_CLASSIFICATIONS
    assert len(data["top_3_factors"]) == 3
    assert "message" in data
    assert "recommendations" in data


def test_predict_high_risk():
    response = client.post("/predict", json=HIGH_RISK)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] > 0.3
    assert data["classification"] in VALID_CLASSIFICATIONS


def test_predict_risk_score_range():
    response = client.post("/predict", json=HEALTHY)
    assert response.status_code == 200
    score = response.json()["risk_score"]
    assert 0.0 <= score <= 1.0


def test_predict_top3_structure():
    response = client.post("/predict", json=HEALTHY)
    assert response.status_code == 200
    factors = response.json()["top_3_factors"]
    assert len(factors) == 3
    for f in factors:
        assert "feature" in f
        assert "shap_value" in f
        assert "shap_direction" in f
        assert f["shap_direction"] in ("positive", "negative")


def test_predict_missing_field():
    response = client.post("/predict", json={"BMI": 25})
    assert response.status_code in [200, 422]


def test_predict_invalid_payload():
    response = client.post("/predict", json={})
    assert response.status_code == 422
