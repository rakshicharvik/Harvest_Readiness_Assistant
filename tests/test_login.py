from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_login_success():
    response = client.post( "/login",
        json={"username": "Rakshi", "is_farmer": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "Rakshi"
    assert data["role"] == "farmer"


def test_login_non_farmer_blocked():
    response = client.post("/login",
        json={"username": "jeethu", "is_farmer": False}
    )
    assert response.status_code == 403
