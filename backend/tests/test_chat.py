from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_chat_basic():
    response = client.post("/chat", json={"message": "Qu'est-ce que le diabète ?"})
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert len(data["response"]) > 0  # any non-empty reply (API or fallback error)


def test_chat_with_context():
    response = client.post("/chat", json={
        "message": "Expliquez mon résultat",
        "patient_context": {
            "risk_score": 0.65,
            "classification": "Diabetique",
        },
    })
    assert response.status_code == 200
    assert "response" in response.json()


def test_chat_empty_message():
    response = client.post("/chat", json={"message": ""})
    assert response.status_code == 200
    assert "response" in response.json()


def test_chat_no_context():
    response = client.post("/chat", json={"message": "Quels sont les symptômes ?"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["response"], str)
    assert len(data["response"]) > 0


def test_chat_missing_message():
    response = client.post("/chat", json={})
    assert response.status_code == 422
