import requests
import json
import time

def test_complete_simulation():
    base_url = "http://127.0.0.1:8000"
    proxy_url = "http://127.0.0.1:5173"

    print("==================================================")
    print("STEP 0: BASELINE NORMAL OPERATIONS (t+0m)")
    print("==================================================")
    r = requests.post(f"{base_url}/api/simulation/set-step?step=0")
    assert r.status_code == 200, f"Failed step 0: {r.text}"
    m0 = requests.get(f"{base_url}/api/metrics").json()
    a0 = requests.get(f"{base_url}/api/alerts").json()
    z0 = requests.get(f"{base_url}/api/zones").json()
    print(f"Metrics: Traffic={m0['traffic']['value']}% ({m0['traffic']['status']}), Rain={m0['rainfall']['value']} mm/h, Civic={m0['civicReports']['value']}, Transit={m0['transitDelay']['value']} min")
    print(f"Active Alerts Count: {len(a0)} (Expected: 0)")
    malviya0 = next(z for z in z0 if "Malviya" in z["name"])
    print(f"Malviya Nagar Zone: Severity={malviya0['severity']} ({malviya0['severity_score']}), Summary: {malviya0['summary']}")
    assert len(a0) == 0, "Alerts should be 0 at baseline!"
    assert malviya0['severity'] == "LOW", "Malviya should be LOW at baseline!"

    print("\n==================================================")
    print("STEP 1: RAINFALL SPIKES (t+5m)")
    print("==================================================")
    r = requests.post(f"{base_url}/api/simulation/set-step?step=1")
    assert r.status_code == 200
    m1 = requests.get(f"{base_url}/api/metrics").json()
    z1 = requests.get(f"{base_url}/api/zones").json()
    print(f"Metrics: Rainfall={m1['rainfall']['value']} mm/h ({m1['rainfall']['status']}), Traffic={m1['traffic']['value']}%")
    malviya1 = next(z for z in z1 if "Malviya" in z["name"])
    print(f"Malviya Nagar Zone: Rain={malviya1['rain']}, Severity={malviya1['severity']}")
    assert m1['rainfall']['value'] >= 70.0, "Rainfall must spike at step 1!"

    print("\n==================================================")
    print("STEP 2: TRAFFIC CONGESTION SPIKES (t+10m)")
    print("==================================================")
    r = requests.post(f"{base_url}/api/simulation/set-step?step=2")
    assert r.status_code == 200
    m2 = requests.get(f"{base_url}/api/metrics").json()
    z2 = requests.get(f"{base_url}/api/zones").json()
    print(f"Metrics: Traffic={m2['traffic']['value']}% ({m2['traffic']['status']}), Delay={m2['transitDelay']['value']} min")
    malviya2 = next(z for z in z2 if "Malviya" in z["name"])
    print(f"Malviya Nagar Zone: Speed={malviya2['speed']}, Severity={malviya2['severity']}")
    assert m2['traffic']['value'] >= 80, "Traffic must spike at step 2!"

    print("\n==================================================")
    print("STEP 3: WATERLOGGING REPORTS SURGE (t+15m)")
    print("==================================================")
    r = requests.post(f"{base_url}/api/simulation/set-step?step=3")
    assert r.status_code == 200
    m3 = requests.get(f"{base_url}/api/metrics").json()
    z3 = requests.get(f"{base_url}/api/zones").json()
    a3 = requests.get(f"{base_url}/api/alerts").json()
    print(f"Metrics: Civic Reports={m3['civicReports']['value']} ({m3['civicReports']['status']}), Delay={m3['transitDelay']['value']} min")
    print(f"Alerts active at step 3: {len(a3)}")
    assert m3['civicReports']['value'] >= 14, "Civic reports must surge at step 3!"
    assert len(a3) >= 1, "Alert must begin forming at step 3!"

    print("\n==================================================")
    print("STEP 4: MULTI-DOMAIN DISRUPTION DETECTED (t+20m)")
    print("==================================================")
    r = requests.post(f"{base_url}/api/simulation/set-step?step=4")
    assert r.status_code == 200
    m4 = requests.get(f"{base_url}/api/metrics").json()
    a4 = requests.get(f"{base_url}/api/alerts").json()
    z4 = requests.get(f"{base_url}/api/zones").json()
    assert len(a4) > 0, "Critical alert must exist at step 4!"
    top = a4[0]
    print(f"[!] CRITICAL ALERT DETECTED:")
    print(f"   Zone: {top['zone']}")
    print(f"   Severity: {top['severity']} (Score: {top['severity_score']})")
    print(f"   Confidence: {top['confidence']}")
    print(f"   Spatial Overlap: {top['spatial_overlap_km']} km")
    print(f"   Temporal Overlap: {top['temporal_overlap_minutes']} min")
    print(f"   Explanation: \"{top['explanation']}\"")
    print(f"   Evidence signals count: {len(top['evidence_breakdown'])}")
    for ev in top['evidence_breakdown']:
        print(f"     * [{ev['source']}] {ev['name']}: {ev['value']} (Baseline: {ev['baseline']})")

    assert top['severity'] == "CRITICAL", "Step 4 must be CRITICAL severity!"
    assert top['confidence'] >= 0.90, "Step 4 must have >=90% confidence!"
    assert "caused by" not in top['explanation'].lower(), "Non-causal check failed: contains 'caused by'!"
    assert "due to" not in top['explanation'].lower(), "Non-causal check failed: contains 'due to'!"

    print("\n==================================================")
    print("STEP 5: VERIFYING VITE FRONTEND PROXY")
    print("==================================================")
    proxy_metrics = requests.get(f"{proxy_url}/api/metrics")
    print(f"Proxy /api/metrics Status: {proxy_metrics.status_code}")
    assert proxy_metrics.status_code == 200, "Vite proxy to /api/metrics failed!"

    proxy_alerts = requests.get(f"{proxy_url}/api/alerts")
    print(f"Proxy /api/alerts Status: {proxy_alerts.status_code}, count: {len(proxy_alerts.json())}")
    assert proxy_alerts.status_code == 200, "Vite proxy to /api/alerts failed!"

    print("\n>>> ALL SIMULATION STAGES AND PROXY CHECKS PASSED 100%! <<<")

if __name__ == "__main__":
    test_complete_simulation()
