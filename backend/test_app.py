import pytest
from app import app, tasks, next_id


@pytest.fixture(autouse=True)
def reset_tasks():
    """Reset tasks list and id counter before every test — clean state."""
    import app as app_module
    app_module.tasks.clear()
    app_module.next_id = 1
    yield


@pytest.fixture
def client():
    """Flask test client — no real server needed."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# ── Health check ────────────────────────────────────────────────────────────

def test_health(client):
    # ARRANGE — nothing needed
    # ACT
    response = client.get("/health")
    # ASSERT
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


# ── GET /tasks ───────────────────────────────────────────────────────────────

def test_get_tasks_empty(client):
    # ARRANGE — tasks are empty (reset by fixture)
    # ACT
    response = client.get("/tasks")
    # ASSERT
    assert response.status_code == 200
    assert response.get_json() == []


def test_get_tasks_returns_all(client):
    # ARRANGE
    client.post("/tasks", json={"title": "Buy groceries"})
    client.post("/tasks", json={"title": "Walk the dog"})
    # ACT
    response = client.get("/tasks")
    data = response.get_json()
    # ASSERT
    assert response.status_code == 200
    assert len(data) == 2
    assert data[0]["title"] == "Buy groceries"
    assert data[1]["title"] == "Walk the dog"


# ── POST /tasks ──────────────────────────────────────────────────────────────

def test_add_task(client):
    # ARRANGE
    payload = {"title": "Learn CI/CD"}
    # ACT
    response = client.post("/tasks", json=payload)
    data = response.get_json()
    # ASSERT
    assert response.status_code == 201
    assert data["title"] == "Learn CI/CD"
    assert data["done"] is False
    assert data["id"] == 1


def test_add_task_missing_title(client):
    # ARRANGE
    payload = {}
    # ACT
    response = client.post("/tasks", json=payload)
    # ASSERT
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_add_task_empty_title(client):
    # ARRANGE
    payload = {"title": "   "}
    # ACT
    response = client.post("/tasks", json=payload)
    # ASSERT
    assert response.status_code == 400


def test_add_multiple_tasks_increments_id(client):
    # ARRANGE + ACT
    r1 = client.post("/tasks", json={"title": "Task one"})
    r2 = client.post("/tasks", json={"title": "Task two"})
    # ASSERT
    assert r1.get_json()["id"] == 1
    assert r2.get_json()["id"] == 2


# ── DELETE /tasks/<id> ───────────────────────────────────────────────────────

def test_delete_task(client):
    # ARRANGE
    client.post("/tasks", json={"title": "Delete me"})
    # ACT
    response = client.delete("/tasks/1")
    # ASSERT
    assert response.status_code == 200
    assert response.get_json()["message"] == "task deleted"
    # verify it's actually gone
    tasks_response = client.get("/tasks")
    assert tasks_response.get_json() == []


def test_delete_task_not_found(client):
    # ARRANGE — no tasks exist
    # ACT
    response = client.delete("/tasks/999")
    # ASSERT
    assert response.status_code == 404
    assert "error" in response.get_json()


# ── PATCH /tasks/<id>/done ───────────────────────────────────────────────────

def test_mark_task_done(client):
    # ARRANGE
    client.post("/tasks", json={"title": "Finish project"})
    # ACT
    response = client.patch("/tasks/1/done")
    data = response.get_json()
    # ASSERT
    assert response.status_code == 200
    assert data["done"] is True


def test_mark_task_done_toggles_back(client):
    # ARRANGE — mark done first
    client.post("/tasks", json={"title": "Toggle me"})
    client.patch("/tasks/1/done")
    # ACT — mark again (should toggle back to False)
    response = client.patch("/tasks/1/done")
    # ASSERT
    assert response.get_json()["done"] is False


def test_mark_done_not_found(client):
    # ARRANGE — no tasks
    # ACT
    response = client.patch("/tasks/999/done")
    # ASSERT
    assert response.status_code == 404