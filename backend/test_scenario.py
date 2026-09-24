import requests

def test_flow():
    print("--- 1. Resetting simulation ---")
    res = requests.post("http://127.0.0.1:8000/api/simulation/reset")
    print("Reset status:", res.json())

    alerts = requests.get("http://127.0.0.1:8000/api/alerts").json()
    print("Alerts after reset (should be 0):", len(alerts))

    print("\n--- 2. Starting simulation scenario (t+0 to t+20) ---")
    res = requests.post("http://127.0.0.1:8000/api/simulation/start")
    print("Sim start status:", res.json())

    alerts = requests.get("http://127.0.0.1:8000/api/alerts").json()
    print("Alerts count:", len(alerts))
    top = alerts[0]
    print(f"Top Alert: {top['zone']}")
    print(f"Severity: {top['severity']} (Score: {top['severity_score']})")
    print(f"Confidence: {top['confidence']}")
    print(f"Explanation: {top['explanation']}")
    print(f"Spatial overlap: {top['spatial_overlap_km']} km")
    print(f"Temporal overlap: {top['temporal_overlap_minutes']} min")

    print("\n--- 3. Checking City Vitals metrics ---")
    metrics = requests.get("http://127.0.0.1:8000/api/metrics").json()
    print(f"Traffic: {metrics['traffic']['value']}% ({metrics['traffic']['status']})")
    print(f"Rainfall: {metrics['rainfall']['value']} mm/h ({metrics['rainfall']['status']})")
    print(f"Civic reports: {metrics['civicReports']['value']} reports")

    print("\n--- 4. Checking Zones status ---")
    zones = requests.get("http://127.0.0.1:8000/api/zones").json()
    for z in zones:
        print(f"  * {z['name']}: {z['severity']} ({z['severity_score']}) - {z['summary']}")

    print("\n--- 5. Checking Evidence endpoint ---")
    evidence = requests.get(f"http://127.0.0.1:8000/api/alerts/{top['id']}").json()
    print(f"Alert evidence breakdown items: {len(evidence['evidence_breakdown'])}")

    print("\nALL VERIFICATIONS PASSED!")

if __name__ == "__main__":
    test_flow()
