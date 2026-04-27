from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

BASE = {
    "HighBP": 1, "HighChol": 1, "CholCheck": 1,
    "BMI": 35, "Smoker": 1, "Stroke": 0,
    "HeartDiseaseorAttack": 0, "PhysActivity": 0,
    "Fruits": 0, "Veggies": 0, "HvyAlcoholConsump": 0,
    "AnyHealthcare": 1, "NoDocbcCost": 0, "GenHlth": 4,
    "MentHlth": 5, "PhysHlth": 10, "DiffWalk": 0,
    "Sex": 1, "Age": 9, "Education": 5, "Income": 5,
}


def test_recommend_returns_5():
    response = client.post("/recommend", json=BASE)
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) == 5


def test_recommend_strings():
    response = client.post("/recommend", json=BASE)
    assert response.status_code == 200
    for rec in response.json()["recommendations"]:
        assert isinstance(rec, str)
        assert len(rec) > 5


def test_recommend_healthy_profile():
    healthy = {**BASE, "BMI": 22, "Smoker": 0, "PhysActivity": 1,
               "Fruits": 1, "Veggies": 1, "HighBP": 0, "HighChol": 0}
    response = client.post("/recommend", json=healthy)
    assert response.status_code == 200
    assert len(response.json()["recommendations"]) == 5


def test_recommend_missing_field():
    response = client.post("/recommend", json={"BMI": 30})
    assert response.status_code in [200, 422]
