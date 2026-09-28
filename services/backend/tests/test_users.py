import uuid
import pytest


def register(client, email="sam@example.com", password="password123"):
    return client.post("/api/v1/users", json={"email": email, "password": password})


def test_create_user_hides_password(client):
    result = register(client)
    assert result.status_code == 201
    body = result.json()
    assert body["email"] == "sam@example.com"
    assert "password" not in body and "passwordHash" not in body


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
    assert body["emailVerified"] is False
    assert body["status"] == "ACTIVE"


def test_get_unknown_user_404s(client):
    assert client.get(f"/api/v1/users/{uuid.uuid4()}").status_code == 404


def test_profile_upsert_creates_then_updates(client):
    user_id = register(client).json()["id"]

    assert client.get(f"/api/v1/users/{user_id}/profile").status_code == 404

    created = client.put(f"/api/v1/users/{user_id}/profile", json={"firstName": "Sam", "heightCm": 178})
    assert created.status_code == 200
    assert created.json()["firstName"] == "Sam"
    assert created.json()["heightCm"] == 178
    assert created.json()["userId"] == user_id
    assert created.json()["preferredWeightUnit"] == "KG"

    fetched = client.get(f"/api/v1/users/{user_id}/profile")
    assert fetched.status_code == 200
    assert fetched.json()["firstName"] == "Sam"

    updated = client.put(f"/api/v1/users/{user_id}/profile", json={"firstName": "Samuel"})
    assert updated.json()["firstName"] == "Samuel"
    assert updated.json()["id"] == created.json()["id"]  # same row, not a second profile
    assert client.get(f"/api/v1/users/{user_id}/profile").json()["firstName"] == "Samuel"


def test_profile_upsert_on_unknown_user_404s(client):
    result = client.put(f"/api/v1/users/{uuid.uuid4()}/profile", json={"firstName": "Sam"})
    assert result.status_code == 404


def test_profile_upsert_rejects_blank_name(client):
    user_id = register(client).json()["id"]
    result = client.put(f"/api/v1/users/{user_id}/profile", json={"firstName": ""})
    assert result.status_code == 422


ASSESSMENT_PAYLOAD = {
    "trainingExperience": "INTERMEDIATE",
    "currentActivityLevel": "MODERATE",
    "goals": [{"type": "BUILD_MUSCLE", "priority": "PRIMARY"}],
    "trainingPreference": {
        "trainingDaysPerWeek": 3, "sessionDurationMinutes": 45,
        "preferredDays": ["Mon", "Wed", "Fri"], "trainingLocation": "COMMERCIAL_GYM",
        "exercisesToAvoid": ["overhead press"],
    },
    "equipment": [{"equipmentType": "BARBELL"}, {"equipmentType": "DUMBBELL"}],
    "healthConstraints": [{"type": "PAIN", "description": "Left knee twinge", "severity": "LOW"}],
    "nutritionPreference": {"dietaryPattern": "NO_PREFERENCE", "allergies": ["peanuts"]},
}


def test_create_assessment_saves_nested_children(client):
    user_id = register(client).json()["id"]
    result = client.post(f"/api/v1/users/{user_id}/assessments", json=ASSESSMENT_PAYLOAD)
    assert result.status_code == 201
    body = result.json()
    assert body["version"] == 1
    assert [g["type"] for g in body["goals"]] == ["BUILD_MUSCLE"]
    assert body["trainingPreference"]["trainingDaysPerWeek"] == 3
    assert len(body["equipment"]) == 2
    assert body["healthConstraints"][0]["description"] == "Left knee twinge"
    assert body["nutritionPreference"]["allergies"] == ["peanuts"]
    assert body["aiAssessment"] is None


def test_assessment_optional_children_can_be_omitted(client):
    user_id = register(client).json()["id"]
    minimal = {
        "trainingExperience": "BEGINNER",
        "currentActivityLevel": "SEDENTARY",
        "goals": [{"type": "MAINTAIN_WEIGHT", "priority": "PRIMARY"}],
        "trainingPreference": {
            "trainingDaysPerWeek": 2, "sessionDurationMinutes": 20,
            "trainingLocation": "HOME",
        },
    }
    result = client.post(f"/api/v1/users/{user_id}/assessments", json=minimal)
    assert result.status_code == 201
    body = result.json()
    assert body["equipment"] == []
    assert body["healthConstraints"] == []
    assert body["nutritionPreference"] is None
    assert body["progressPhotos"] == []


def test_assessment_on_unknown_user_404s(client):
    result = client.post(f"/api/v1/users/{uuid.uuid4()}/assessments", json=ASSESSMENT_PAYLOAD)
    assert result.status_code == 404


def test_assessment_requires_at_least_one_goal(client):
    user_id = register(client).json()["id"]
    payload = {**ASSESSMENT_PAYLOAD, "goals": []}
    assert client.post(f"/api/v1/users/{user_id}/assessments", json=payload).status_code == 422


def test_assessment_rejects_unknown_enum_value(client):
    user_id = register(client).json()["id"]
    payload = {**ASSESSMENT_PAYLOAD, "trainingExperience": "EXPERT"}
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
                           json={"view": "FRONT", "storageKey": "s3://bucket/front.jpg"})
    assert created.status_code == 201
    body = created.json()
    assert body["userId"] == user_id
    assert body["aiAnalysisAllowed"] is False
    assert body["deletedAt"] is None

    listed = client.get(f"/api/v1/users/{user_id}/progress-photos")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["storageKey"] == "s3://bucket/front.jpg"


def test_progress_photo_list_is_empty_with_none_uploaded(client):
    user_id = register(client).json()["id"]
    result = client.get(f"/api/v1/users/{user_id}/progress-photos")
    assert result.status_code == 200
    assert result.json() == []


def test_progress_photo_on_unknown_user_404s(client):
    result = client.post(f"/api/v1/users/{uuid.uuid4()}/progress-photos",
                          json={"view": "FRONT", "storageKey": "s3://bucket/front.jpg"})
    assert result.status_code == 404


def test_progress_photo_can_link_to_an_assessment(client):
    user_id = register(client).json()["id"]
    assessment_id = client.post(f"/api/v1/users/{user_id}/assessments", json=ASSESSMENT_PAYLOAD).json()["id"]
    created = client.post(f"/api/v1/users/{user_id}/progress-photos",
                           json={"view": "SIDE", "storageKey": "s3://bucket/side.jpg", "assessmentId": assessment_id})
    assert created.status_code == 201
    assert created.json()["assessmentId"] == assessment_id
