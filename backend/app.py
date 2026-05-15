from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows React frontend to talk to Flask

tasks = []  # in-memory task storage
next_id = 1  # auto-increment task id


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint — used by monitor.py after deployment."""
    return jsonify({"status": "ok"}), 200


@app.route("/tasks", methods=["GET"])
def get_tasks():
    """Return all tasks."""
    return jsonify(tasks), 200


@app.route("/tasks", methods=["POST"])
def add_task():
    """Add a new task. Expects JSON: { "title": "task name" }"""
    global next_id
    data = request.get_json()

    if not data or "title" not in data:
        return jsonify({"error": "title is required"}), 400

    title = data["title"].strip()
    if not title:
        return jsonify({"error": "title cannot be empty"}), 400

    task = {"id": next_id, "title": title, "done": False}
    tasks.append(task)
    next_id += 1

    return jsonify(task), 201


@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    """Delete a task by id."""
    global tasks
    task = next((t for t in tasks if t["id"] == task_id), None)

    if not task:
        return jsonify({"error": "task not found"}), 404

    tasks = [t for t in tasks if t["id"] != task_id]
    return jsonify({"message": "task deleted"}), 200


@app.route("/tasks/<int:task_id>/done", methods=["PATCH"])
def mark_done(task_id):
    """Toggle a task's done status."""
    task = next((t for t in tasks if t["id"] == task_id), None)

    if not task:
        return jsonify({"error": "task not found"}), 404

    task["done"] = not task["done"]
    return jsonify(task), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)