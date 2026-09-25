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


def test_get_user_returns_the_created_account(client):
    created = register(client).json()
    fetched = client.get(f"/api/v1/users/{created['id']}")
    assert fetched.status_code == 200
    body = fetched.json()
    assert body["id"] == created["id"]
    assert body["email"] == "sam@example.com"
    assert body["email_verified"] is False
    assert body["status"] == "ACTIVE"


def test_get_unknown_user_404s(client):
    assert client.get(f"/api/v1/users/{uuid.uuid4()}").status_code == 404


def test_profile_upsert_creates_then_updates(client):
    user_id = register(client).json()["id"]

    assert client.get(f"/api/v1/users/{user_id}/profile").status_code == 404

    created = client.put(f"/api/v1/users/{user_id}/profile", json={"first_name": "Sam", "height_cm": 178})
    assert created.status_code == 200
    assert created.json()["first_name"] == "Sam"
    assert created.json()["height_cm"] == 178
    assert created.json()["user_id"] == user_id
    assert created.json()["preferred_weight_unit"] == "KG"

    fetched = client.get(f"/api/v1/users/{user_id}/profile")
    assert fetched.status_code == 200
    assert fetched.json()["first_name"] == "Sam"

    updated = client.put(f"/api/v1/users/{user_id}/profile", json={"first_name": "Samuel"})
    assert updated.json()["first_name"] == "Samuel"
    assert updated.json()["id"] == created.json()["id"]  # same row, not a second profile
    assert client.get(f"/api/v1/users/{user_id}/profile").json()["first_name"] == "Samuel"


def test_profile_upsert_on_unknown_user_404s(client):
    result = client.put(f"/api/v1/users/{uuid.uuid4()}/profile", json={"first_name": "Sam"})
    assert result.status_code == 404


def test_profile_upsert_rejects_blank_name(client):
    user_id = register(client).json()["id"]
    result = client.put(f"/api/v1/users/{user_id}/profile", json={"first_name": ""})
    assert result.status_code == 422


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


def test_assessment_optional_children_can_be_omitted(client):
    user_id = register(client).json()["id"]
    minimal = {
        "training_experience": "BEGINNER",
        "current_activity_level": "SEDENTARY",
        "goals": [{"type": "MAINTAIN_WEIGHT", "priority": "PRIMARY"}],
        "training_preference": {
            "training_days_per_week": 2, "session_duration_minutes": 20,
            "training_location": "HOME",
        },
    }
    result = client.post(f"/api/v1/users/{user_id}/assessments", json=minimal)
    assert result.status_code == 201
    body = result.json()
    assert body["equipment"] == []
    assert body["health_constraints"] == []
    assert body["nutrition_preference"] is None
    assert body["progress_photos"] == []


def test_assessment_on_unknown_user_404s(client):
    result = client.post(f"/api/v1/users/{uuid.uuid4()}/assessments", json=ASSESSMENT_PAYLOAD)
    assert result.status_code == 404


def test_assessment_requires_at_least_one_goal(client):
    user_id = register(client).json()["id"]
    payload = {**ASSESSMENT_PAYLOAD, "goals": []}
    assert client.post(f"/api/v1/users/{user_id}/assessments", json=payload).status_code == 422


def test_assessment_rejects_unknown_enum_value(client):
    user_id = register(client).json()["id"]
    payload = {**ASSESSMENT_PAYLOAD, "training_experience": "EXPERT"}
    assert client.post(f"/api/v1/users/{user_id}/assessments", json=payload).status_code == 422


def test_assessment_version_increments_and_latest_wins(client):
    user_id = register(client).json()["id"]
    client.post(f"/api/v1/users/{user_id}/assessments", json=ASSESSMENT_PAYLOAD)
    second = client.post(f"/api/v1/users/{user_id}/assessments", json=ASSESSMENT_PAYLOAD)
    assert second.json()["version"] == 2

    latest = client.get(f"/api/v1/users/{user_id}/assessments/latest")
    assert latest.json()["version"] == 2

    listed = client.get(f"/api/v1/users/{user_id}/assessments")
    assert len(listed.json()) == 2
    assert [a["version"] for a in listed.json()] == [2, 1]


def test_latest_assessment_404s_with_none_recorded(client):
    user_id = register(client).json()["id"]
    assert client.get(f"/api/v1/users/{user_id}/assessments/latest").status_code == 404


def test_list_assessments_is_empty_not_404_with_none_recorded(client):
    user_id = register(client).json()["id"]
    result = client.get(f"/api/v1/users/{user_id}/assessments")
    assert result.status_code == 200
    assert result.json() == []


def test_progress_photo_create_and_list(client):
    user_id = register(client).json()["id"]
    created = client.post(f"/api/v1/users/{user_id}/progress-photos",
                           json={"view": "FRONT", "storage_key": "s3://bucket/front.jpg"})
    assert created.status_code == 201
    body = created.json()
    assert body["user_id"] == user_id
    assert body["ai_analysis_allowed"] is False
    assert body["deleted_at"] is None

    listed = client.get(f"/api/v1/users/{user_id}/progress-photos")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["storage_key"] == "s3://bucket/front.jpg"


def test_progress_photo_list_is_empty_with_none_uploaded(client):
    user_id = register(client).json()["id"]
    result = client.get(f"/api/v1/users/{user_id}/progress-photos")
    assert result.status_code == 200
    assert result.json() == []


def test_progress_photo_on_unknown_user_404s(client):
    result = client.post(f"/api/v1/users/{uuid.uuid4()}/progress-photos",
                          json={"view": "FRONT", "storage_key": "s3://bucket/front.jpg"})
    assert result.status_code == 404


def test_progress_photo_can_link_to_an_assessment(client):
    user_id = register(client).json()["id"]
    assessment_id = client.post(f"/api/v1/users/{user_id}/assessments", json=ASSESSMENT_PAYLOAD).json()["id"]
    created = client.post(f"/api/v1/users/{user_id}/progress-photos",
                           json={"view": "SIDE", "storage_key": "s3://bucket/side.jpg", "assessment_id": assessment_id})
    assert created.status_code == 201
    assert created.json()["assessment_id"] == assessment_id
