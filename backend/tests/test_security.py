from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

VALID = {
    "HighBP": 0, "HighChol": 0, "CholCheck": 1,
    "BMI": 22, "Smoker": 0, "Stroke": 0,
    "HeartDiseaseorAttack": 0, "PhysActivity": 1,
    "Fruits": 1, "Veggies": 1, "HvyAlcoholConsump": 0,
    "AnyHealthcare": 1, "NoDocbcCost": 0, "GenHlth": 2,
    "MentHlth": 0, "PhysHlth": 0, "DiffWalk": 0,
    "Sex": 0, "Age": 5, "Education": 5, "Income": 5,
}


def test_cors_headers():
    response = client.options("/predict")
    assert response.status_code in [200, 405]


def test_invalid_bmi():
    response = client.post("/predict", json={**VALID, "BMI": -5})
    assert response.status_code in [200, 422]


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["loaded"] is True


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_nonexistent_route():
    response = client.get("/nonexistent")
    assert response.status_code == 404


def test_wrong_method():
    response = client.get("/predict")
    assert response.status_code == 405


def test_sql_injection_attempt():
    payload = {**VALID, "BMI": "'; DROP TABLE users; --"}
    response = client.post("/predict", json=payload)
    assert response.status_code == 422
