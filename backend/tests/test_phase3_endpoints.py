import unittest
from api.data_hub import get_data_hub_overview
from api.response import get_response_context, execute_response_action, ActionRequest
from api.ask import ask_citypulse, AskRequest

class TestPhase3Endpoints(unittest.TestCase):

    def test_data_hub_overview(self):
        data = get_data_hub_overview()
        self.assertIn("pipeline_stages", data)
        self.assertEqual(len(data["pipeline_stages"]), 6)
        self.assertIn("source_cards", data)
        self.assertEqual(len(data["source_cards"]), 3)
        self.assertIn("ml_validation", data)
        self.assertGreater(data["ml_validation"]["roc_auc_score"], 0.90)
        self.assertIn("disclaimer", data)
        self.assertIn("Correlation detected; causation is not established.", data["disclaimer"])

    def test_response_context(self):
        data = get_response_context()
        self.assertIn("situation", data)
        self.assertIn("signals", data["situation"])
        self.assertIn("reroute_simulation", data)
        self.assertIn("nearby_corridors", data)
        self.assertGreaterEqual(len(data["nearby_corridors"]), 4)
        for corridor in data["nearby_corridors"]:
            self.assertIn("distance_km", corridor)
            self.assertGreater(corridor["distance_km"], 0)
            self.assertIn("recommendation", corridor)

    def test_response_actions(self):
        actions = ["broadcast_alert", "monitor_nearby", "simulate_reroute", "review_evidence"]
        for act in actions:
            req = ActionRequest(action_type=act)
            res = execute_response_action(req)
            self.assertEqual(res["status"], "success")
            self.assertIn("action", res)
            self.assertEqual(res["action"]["action_type"], act)

    def test_ask_citypulse(self):
        req = AskRequest(question="Why is Malviya Nagar evaluated at high disruption risk?")
        res = ask_citypulse(req)
        self.assertTrue(len(res.answer) > 10)
        self.assertGreaterEqual(len(res.evidence), 2)
        self.assertIsNotNone(res.relevant_signals)
        self.assertIn("High", res.confidence)
        self.assertIn("causation is not established", res.limitation)
