import uuid
import pytest


def register(client, email="sam@example.com", password="password123"):
    return client.post("/api/v1/users", json={"email": email, "password": password})


def test_create_user_hides_password(client):
    result = register(client)
    assert result.status_code == 201
    body = result.json()
    assert body["email"] == "sam@example.com"
    assert "password" not in body and "password_hash" not in body


def test_duplicate_email_is_rejected(client):
    register(client)
    assert register(client).status_code == 409


@pytest.mark.parametrize("payload", [
    {"email": "not-an-email", "password": "password123"},
    {"email": "sam@example.com", "password": "short"},
])
def test_invalid_registration_is_rejected(client, payload):
    assert client.post("/api/v1/users", json=payload).status_code == 422


def test_get_unknown_user_404s(client):
    assert client.get(f"/api/v1/users/{uuid.uuid4()}").status_code == 404


def test_profile_upsert_creates_then_updates(client):
    user_id = register(client).json()["id"]

    assert client.get(f"/api/v1/users/{user_id}/profile").status_code == 404

    created = client.put(f"/api/v1/users/{user_id}/profile", json={"first_name": "Sam", "height_cm": 178})
    assert created.status_code == 200
    assert created.json()["first_name"] == "Sam"
    assert created.json()["height_cm"] == 178

    updated = client.put(f"/api/v1/users/{user_id}/profile", json={"first_name": "Samuel"})
    assert updated.json()["first_name"] == "Samuel"
    assert client.get(f"/api/v1/users/{user_id}/profile").json()["first_name"] == "Samuel"


ASSESSMENT_PAYLOAD = {
    "training_experience": "INTERMEDIATE",
    "current_activity_level": "MODERATE",
    "goals": [{"type": "BUILD_MUSCLE", "priority": "PRIMARY"}],
    "training_preference": {
        "training_days_per_week": 3, "session_duration_minutes": 45,
        "preferred_days": ["Mon", "Wed", "Fri"], "training_location": "COMMERCIAL_GYM",
        "exercises_to_avoid": ["overhead press"],
    },
    "equipment": [{"equipment_type": "BARBELL"}, {"equipment_type": "DUMBBELL"}],
    "health_constraints": [{"type": "PAIN", "description": "Left knee twinge", "severity": "LOW"}],
    "nutrition_preference": {"dietary_pattern": "NO_PREFERENCE", "allergies": ["peanuts"]},
}


def test_create_assessment_saves_nested_children(client):
    user_id = register(client).json()["id"]
    result = client.post(f"/api/v1/users/{user_id}/assessments", json=ASSESSMENT_PAYLOAD)
    assert result.status_code == 201
    body = result.json()
    assert body["version"] == 1
    assert [g["type"] for g in body["goals"]] == ["BUILD_MUSCLE"]
    assert body["training_preference"]["training_days_per_week"] == 3
    assert len(body["equipment"]) == 2
    assert body["health_constraints"][0]["description"] == "Left knee twinge"
    assert body["nutrition_preference"]["allergies"] == ["peanuts"]
    assert body["ai_assessment"] is None


def test_assessment_version_increments_and_latest_wins(client):
    user_id = register(client).json()["id"]
    client.post(f"/api/v1/users/{user_id}/assessments", json=ASSESSMENT_PAYLOAD)
    second = client.post(f"/api/v1/users/{user_id}/assessments", json=ASSESSMENT_PAYLOAD)
    assert second.json()["version"] == 2

    latest = client.get(f"/api/v1/users/{user_id}/assessments/latest")
    assert latest.json()["version"] == 2

    listed = client.get(f"/api/v1/users/{user_id}/assessments")
    assert len(listed.json()) == 2


def test_latest_assessment_404s_with_none_recorded(client):
    user_id = register(client).json()["id"]
    assert client.get(f"/api/v1/users/{user_id}/assessments/latest").status_code == 404


def test_progress_photo_create_and_list(client):
    user_id = register(client).json()["id"]
    created = client.post(f"/api/v1/users/{user_id}/progress-photos",
                           json={"view": "FRONT", "storage_key": "s3://bucket/front.jpg"})
    assert created.status_code == 201
    listed = client.get(f"/api/v1/users/{user_id}/progress-photos")
    assert len(listed.json()) == 1
    assert listed.json()[0]["storage_key"] == "s3://bucket/front.jpg"
