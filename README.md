# Task Manager — Full CI/CD Showcase Project

A full-stack task manager application built to demonstrate a complete CI/CD pipeline using GitHub Actions, Jenkins, and Blue/Green deployment strategy.

---

## What This Project Demonstrates

- Continuous Integration with GitHub Actions
- Continuous Deployment with Jenkins
- Unit Testing with AAA pattern (pytest + vitest)
- Artifacts — packaging and uploading build outputs
- Webhooks — automatic Jenkins triggering on every push
- Staging environment with health checks
- Blue/Green deployment strategy
- Post-deployment monitoring

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask, Flask-CORS |
| Frontend | React, Vite |
| CI Platform | GitHub Actions |
| CD Platform | Jenkins |
| Backend Tests | pytest, pytest-cov |
| Frontend Tests | Vitest, Testing Library |
| Deployment | Blue/Green via nginx |
| Monitoring | Custom monitor.py |
| Tunnel | ngrok (local development) |

---

## Project Structure

```
cicd-project/
│
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI pipeline
│
├── backend/
│   ├── app.py              # Flask REST API (5 endpoints)
│   ├── test_app.py         # 12 unit tests (AAA pattern)
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── App.test.jsx    # 7 unit tests
│   │   ├── main.jsx        # React entry point
│   │   └── setupTests.js   # Vitest setup
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── Jenkinsfile             # Jenkins CD pipeline (6 stages)
├── monitor.py              # Post-deployment health checker
└── README.md
```

---

## The Application

A task manager where you can add, complete, and delete tasks.

### Flask API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check — returns `{"status": "ok"}` |
| `/tasks` | GET | Get all tasks |
| `/tasks` | POST | Add a new task |
| `/tasks/<id>` | DELETE | Delete a task by id |
| `/tasks/<id>/done` | PATCH | Toggle task done/undone |

---

## How to Run Locally

### Requirements
- Python 3.10+
- Node.js 18+
- pip
- npm

### Terminal 1 — Flask Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
# Running at http://localhost:5000
```

### Terminal 2 — React Frontend
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173
```

Open `http://localhost:5173` in your browser.

### Run Tests

**Backend:**
```bash
cd backend
source venv/bin/activate
pytest -v --cov=app --cov-report=term-missing
```

**Frontend:**
```bash
cd frontend
npm test
```

---

## CI/CD Pipeline

### GitHub Actions — CI (ci.yml)

Triggers on every push to `main`.

```
Job 1: backend-ci
  → Checkout code
  → Setup Python 3.10
  → pip install -r requirements.txt
  → pytest -v --cov=app
  → Upload backend artifact

Job 2: frontend-ci (needs: backend-ci)
  → Checkout code
  → Setup Node 18
  → npm install
  → npm test
  → npm run build
  → Upload frontend artifact (dist/)

Job 3: ci-success (needs: both)
  → Confirms all checks passed
```

Total CI time: ~26 seconds

### Jenkins — CD (Jenkinsfile)

Triggers automatically via GitHub webhook.

```
Stage 1: Checkout
  → Pulls latest code from GitHub

Stage 2: Backend CI
  → Creates Python virtual environment
  → Installs dependencies
  → Runs all tests with coverage

Stage 3: Frontend CI
  → npm install
  → npm test
  → npm run build

Stage 4: Deploy to Staging
  → Starts Flask on port 5000
  → Runs health check: GET /health
  → Stops pipeline if unhealthy

Stage 5: Blue/Green Deploy
  → Checks active environment (blue/green)
  → Deploys new version to inactive environment
  → Health checks new environment
  → Switches traffic if healthy
  → Old environment stays live as rollback

Stage 6: Monitor
  → Runs monitor.py
  → 3 health checks with 2 second gaps
  → Saves metrics to metrics.json
  → exit(0) = success | exit(1) = failure
```

Total CD time: ~48 seconds

---

## Blue/Green Deployment

Two identical environments always running:

```
BLUE  → port 5001 (current live version)
GREEN → port 5002 (new version being deployed)
```

**Deployment flow:**
```
New version deploys to GREEN (inactive)
        ↓
Health check passes on GREEN
        ↓
Traffic switches from BLUE to GREEN
        ↓
BLUE stays running as instant rollback
```

**Rollback:**
If the health check on GREEN fails — traffic never switches. BLUE continues serving users with zero downtime.

---

## Monitoring

`monitor.py` runs after every deployment:

- Hits `/health` endpoint 3 times
- Measures response latency
- Handles connection errors and timeouts
- Saves results to `metrics.json`
- Controls Jenkins result via exit code

**Sample metrics.json output:**
```json
{
  "url": "http://localhost:5000",
  "total_checks": 3,
  "passed": 3,
  "failed": 0,
  "avg_latency": 45.2,
  "status": "HEALTHY"
}
```

---

## Webhook Setup (Local Development)

Since Jenkins runs locally, ngrok is used to expose it to GitHub:

```bash
# Start ngrok
ngrok http 8080

# Copy the forwarding URL e.g:
# https://blasphemy-penny-reviver.ngrok-free.dev

# Add webhook in GitHub:
# Settings → Webhooks → Add webhook
# Payload URL: https://your-ngrok-url.ngrok-free.dev/github-webhook/
# Content type: application/json
# Event: Just the push event
```

---

## Complete Flow — End to End

```
git push to main
        ↓
GitHub Actions triggers (CI)          ~26 seconds
  ✓ 12 Flask tests passed
  ✓ 7 React tests passed
  ✓ React app built
  ✓ Artifacts uploaded
        ↓
GitHub webhook fires → ngrok → Jenkins
        ↓
Jenkins pipeline triggers (CD)        ~48 seconds
  ✓ Code checked out
  ✓ Backend tested
  ✓ Frontend tested and built
  ✓ Staging health check passed
  ✓ New version deployed to green
  ✓ Traffic switched to green
  ✓ monitor.py confirmed healthy
        ↓
Deployment complete ✅
Total: ~74 seconds from push to live
```

---

## Key Concepts Demonstrated

| Concept | Implementation |
|---|---|
| CI | GitHub Actions ci.yml |
| CD | Jenkins Jenkinsfile |
| Unit Testing | pytest (12 tests) + vitest (7 tests) |
| AAA Pattern | Every test in test_app.py and App.test.jsx |
| Artifacts | upload-artifact@v4 in ci.yml |
| needs keyword | frontend-ci needs backend-ci |
| Webhooks | GitHub → ngrok → Jenkins |
| Staging | Stage 4 in Jenkinsfile |
| Blue/Green | Stage 5 in Jenkinsfile |
| Health Check | /health endpoint + curl + monitor.py |
| Post-deploy Monitor | monitor.py with metrics.json |
| Virtual Environment | python3 -m venv in Jenkins |
| gitignore | node_modules, __pycache__, dist, .env |

---

## Author

**Mujab Yousef** — DevOps & Cloud Journey 2026

> Next: configuration management (Ansible)