from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_harvest_question_valid():
    payload = {
        "user_id": 1,
        "question": "When is my wheat ready to harvest?",
        "crop": "Wheat",
        "cropOther": None,
        "season": "Rabi",
        "location": "Tamil Nadu",
        "soil": "Loam",
    }
    r = client.post("/ask", json=payload)   
    assert r.status_code == 200
    assert "answer" in r.json()

def test_non_harvest_question_rejected():
    payload = {
    
        "question": "When is my wheat ready to fertilize?",
        "crop": "Wheat",
        "cropOther": None,
        "season": None,
        "location": None,
        "soil": None,
    }
    r = client.post("/ask", json=payload)   
    assert r.status_code == 200
    assert "harvest" in r.json()["answer"].lower()
