import requests
import os
import time
import json
from datetime import datetime

# ── Configuration ─────────────────────────────────────────────────────────────
URL = os.getenv('SITE_URL', 'http://localhost:5000')  # gets URL from environment
CHECKS = 3       # number of times to check
WAIT   = 2       # seconds between checks

# ── Results storage ───────────────────────────────────────────────────────────
results = []

print('=========================================')
print(' Task Manager — Deployment Monitor')
print(f' Checking: {URL}')
print('=========================================')

# ── Run health checks ─────────────────────────────────────────────────────────
for i in range(1, CHECKS + 1):
    print(f'\nCheck {i} of {CHECKS}...')

    try:
        start    = time.time()
        response = requests.get(f'{URL}/health', timeout=10)
        latency  = round((time.time() - start) * 1000, 2)  # convert to ms

        result = {
            'check'          : i,
            'url'            : f'{URL}/health',
            'status_code'    : response.status_code,
            'latency_ms'     : latency,
            'healthy'        : response.status_code == 200,
            'timestamp'      : datetime.utcnow().isoformat() + 'Z'
        }

        if response.status_code == 200:
            print(f'  status  : {response.status_code} OK')
            print(f'  latency : {latency}ms')
            print(f'  result  : HEALTHY')
        else:
            print(f'  status  : {response.status_code}')
            print(f'  result  : UNHEALTHY')

    except requests.exceptions.ConnectionError: # if the app is not running at all
        result = {
            'check'      : i,
            'url'        : f'{URL}/health',
            'status_code': None,
            'latency_ms' : None,
            'healthy'    : False,
            'error'      : 'Connection refused — is the app running?',
            'timestamp'  : datetime.utcnow().isoformat() + 'Z'
        }
        print(f'  result  : FAILED — could not connect to {URL}')

    except requests.exceptions.Timeout: # if the app is running but not responding 
        result = {
            'check'      : i,
            'url'        : f'{URL}/health',
            'status_code': None,
            'latency_ms' : None,
            'healthy'    : False,
            'error'      : 'Request timed out after 10 seconds',
            'timestamp'  : datetime.utcnow().isoformat() + 'Z'
        }
        print(f'  result  : FAILED — request timed out')

    results.append(result)

    if i < CHECKS:
        time.sleep(WAIT)

# ── Summary ───────────────────────────────────────────────────────────────────
passed = sum(1 for r in results if r['healthy'])
failed = CHECKS - passed

avg_latency = round(
    sum(r['latency_ms'] for r in results if r['latency_ms']) / max(passed, 1), 2
)

summary = {
    'url'         : URL,
    'total_checks': CHECKS,
    'passed'      : passed,
    'failed'      : failed,
    'avg_latency' : avg_latency,
    'status'      : 'HEALTHY' if failed == 0 else 'UNHEALTHY',
    'results'     : results
}

print('\n=========================================')
print(f' Summary')
print('=========================================')
print(f'  URL          : {URL}')
print(f'  Total checks : {CHECKS}')
print(f'  Passed       : {passed}')
print(f'  Failed       : {failed}')
print(f'  Avg latency  : {avg_latency}ms')
print(f'  Status       : {summary["status"]}')
print('=========================================')

# ── Save metrics to file ──────────────────────────────────────────────────────
with open('metrics.json', 'w') as f:
    json.dump(summary, f, indent=2)

print('\nMetrics saved to metrics.json')

# ── Exit code ─────────────────────────────────────────────────────────────────
# exit 1 = pipeline fails if app is unhealthy
if failed > 0:
    print('DEPLOYMENT MONITOR: App is unhealthy — check logs!')
    exit(1)
else:
    print('DEPLOYMENT MONITOR: App is healthy — deployment successful!')
    exit(0)