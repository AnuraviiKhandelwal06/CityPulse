import unittest
import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"


class TestMLIntegration(unittest.TestCase):

    def test_01_prediction_endpoint_exists(self):
        url = f"{BASE_URL}/api/prediction"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as res:
            self.assertEqual(res.status, 200)
            data = json.loads(res.read().decode())
            self.assertIn("risk_level", data)
            self.assertIn("risk_probability", data)
            self.assertIn("risk_drivers", data)
            self.assertEqual(data["model"], "HistGradientBoosting")
            self.assertIn(data["status"], ["experimental", "unavailable"])

    def test_02_simulation_evolution(self):
        # Step 0: Baseline Normal -> LOW risk
        urllib.request.urlopen(f"{BASE_URL}/api/simulation/set-step?step=0", data=b"")
        with urllib.request.urlopen(f"{BASE_URL}/api/prediction?step=0") as res:
            d0 = json.loads(res.read().decode())
            self.assertEqual(d0["risk_level"], "LOW")
            self.assertLess(d0["risk_probability"], 0.35)

        # Step 1: Rainfall Surge -> HIGH risk nowcast
        urllib.request.urlopen(f"{BASE_URL}/api/simulation/set-step?step=1", data=b"")
        with urllib.request.urlopen(f"{BASE_URL}/api/prediction?step=1") as res:
            d1 = json.loads(res.read().decode())
            self.assertEqual(d1["risk_level"], "HIGH")
            self.assertGreaterEqual(d1["risk_probability"], 0.70)
            self.assertTrue(any("Rainfall" in d or "rainfall" in d for d in d1["risk_drivers"]))

        # Step 4: Multi-Domain Disruption -> HIGH risk with multiple drivers
        urllib.request.urlopen(f"{BASE_URL}/api/simulation/set-step?step=4", data=b"")
        with urllib.request.urlopen(f"{BASE_URL}/api/prediction?step=4") as res:
            d4 = json.loads(res.read().decode())
            self.assertEqual(d4["risk_level"], "HIGH")
            self.assertGreaterEqual(d4["risk_probability"], 0.90)
            self.assertGreaterEqual(len(d4["risk_drivers"]), 2)

    def test_03_existing_detection_unbroken(self):
        # Ensure alerts and metrics still work perfectly alongside prediction
        urllib.request.urlopen(f"{BASE_URL}/api/simulation/set-step?step=4", data=b"")
        with urllib.request.urlopen(f"{BASE_URL}/api/alerts") as res:
            alerts = json.loads(res.read().decode())
            self.assertGreaterEqual(len(alerts), 1)
            self.assertEqual(alerts[0]["severity"], "CRITICAL")
            self.assertIn("temporal_correlation_text", alerts[0])
            self.assertIn("spatial_correlation_text", alerts[0])

        with urllib.request.urlopen(f"{BASE_URL}/api/metrics") as res:
            metrics = json.loads(res.read().decode())
            self.assertEqual(metrics["traffic"]["value"], 88)
            self.assertGreaterEqual(metrics["rainfall"]["value"], 75.0)

    def test_04_fallback_safety(self):
        from ml.predictor import NowcastPredictor
        # Create an uninitialized predictor to test fallback response
        broken_p = NowcastPredictor(data_dir="non_existent_dir_12345")
        broken_p.is_ready = False
        broken_p.model = None
        broken_res = broken_p.predict(0)
        self.assertEqual(broken_res["risk_level"], "Unavailable")
        self.assertIsNone(broken_res["risk_probability"])
        self.assertEqual(broken_res["status"], "unavailable")
        self.assertIn("unavailable", broken_res["risk_drivers"][0].lower())


if __name__ == "__main__":
    unittest.main()
