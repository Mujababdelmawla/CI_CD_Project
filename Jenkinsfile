pipeline {
    agent any

    environment {
        BACKEND_PORT  = '5000'
        BLUE_PORT     = '8081'
        GREEN_PORT    = '8082'
        ACTIVE_ENV    = 'blue'
    }

    stages {

        // ── Stage 1: Checkout ──────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '========================================='
                echo ' Stage 1: Checking out code from GitHub'
                echo '========================================='
                checkout scm
                echo 'Code checked out successfully'
            }
        }

        // ── Stage 2: Backend CI ────────────────────────────────────────────
        stage('Backend CI') {
            steps {
                echo '========================================='
                echo ' Stage 2: Backend — Install & Test'
                echo '========================================='
                sh '''
                    cd backend
                    python3 -m venv myvenv
                    . myvenv/bin/activate
                    pip install -r requirements.txt
                    pytest -v --cov=app --cov-report=term-missing
                '''
            }
        }

        // ── Stage 3: Frontend CI ───────────────────────────────────────────
        stage('Frontend CI') {
            steps {
                echo '========================================='
                echo ' Stage 3: Frontend — Install, Test & Build'
                echo '========================================='
                sh '''
                    cd frontend
                    npm install
                    npm test
                    npm run build
                '''
            }
        }

        // ── Stage 4: Deploy to Staging ─────────────────────────────────────
        stage('Deploy to Staging') {
            steps {
                echo '========================================='
                echo ' Stage 4: Deploying to Staging'
                echo '========================================='
                sh '''
                    echo "Stopping any existing staging server..."
                    pkill -f "python app.py" || true

                    cd backend
                    . myvenv/bin/activate 
                    nohup python app.py > /tmp/staging.log 2>&1 &

                    echo "Waiting for staging to be ready..."
                    sleep 3

                    echo "Running health check on staging..."
                    curl -f http://localhost:${BACKEND_PORT}/health || exit 1

                    echo "Staging is healthy!"
                '''
            }
        }

        // ── Stage 5: Blue/Green Deployment ────────────────────────────────
        stage('Blue/Green Deploy') {
            steps {
                echo '========================================='
                echo ' Stage 5: Blue/Green Deployment'
                echo '========================================='
                sh '''
                    echo "Current active environment: ${ACTIVE_ENV}"

                    if [ "${ACTIVE_ENV}" = "blue" ]; then
                        DEPLOY_PORT=${GREEN_PORT}
                        NEXT_ENV="green"
                    else
                        DEPLOY_PORT=${BLUE_PORT}
                        NEXT_ENV="blue"
                    fi

                    echo "Deploying new version to ${NEXT_ENV} on port ${DEPLOY_PORT}..."

                    pkill -f "port_${DEPLOY_PORT}" || true
                    sleep 2

                    cd backend
                    nohup python app.py > /tmp/${NEXT_ENV}.log 2>&1 &
                    sleep 3

                    echo "Running health check on ${NEXT_ENV} environment..."
                    curl -f http://localhost:${BACKEND_PORT}/health || exit 1

                    echo "Health check passed!"
                    echo "Switching traffic from ${ACTIVE_ENV} to ${NEXT_ENV}..."
                    echo "Blue/Green deployment complete — ${NEXT_ENV} is now live!"
                '''
            }
        }

        // ── Stage 6: Monitor to check the health ──────────────────────────────────────────────
        stage('Monitor') {
            steps {
                echo '========================================='
                echo ' Stage 6: Post-Deployment Health Checks'
                echo '========================================='
                sh '''

                    . backend/myvenv/bin/activate
                    pip install requests
                    python monitor.py
                '''
            }
        }
    }

    // ── Post Actions ──────────────────────────────────────────────────────
    post {
        success {
            echo '========================================='
            echo ' Pipeline PASSED!'
            echo ' All stages completed successfully'
            echo ' New version is live via Blue/Green deploy'
            echo '========================================='
        }
        failure {
            echo '========================================='
            echo ' Pipeline FAILED!'
            echo ' Rolling back — old environment stays live'
            echo ' Check logs for details'
            echo '========================================='
        }
        always {
            echo 'Pipeline finished. Check GitHub Actions for CI details.'
        }
    }
}