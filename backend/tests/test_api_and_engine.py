import unittest
from datetime import datetime, timezone
import math

from models.events import UnifiedEvent, DisruptionEvent
from normalization.normalizer import (
    normalize_weather_event,
    normalize_traffic_event,
    normalize_incident_event
)
from analytics.anomaly import AnomalyDetector
from analytics.geo import haversine_distance_km, filter_geo_correlated_events
from analytics.correlation import group_temporal_events
from analytics.severity import compute_severity_and_confidence, build_disruption_event
from ai.summarizer import generate_grounded_summary

class TestCityPulseEngine(unittest.TestCase):

    def test_normalization_weather(self):
        raw = {
            "temperature": 26.5,
            "rainfall": 78.4,
            "humidity": 95,
            "lat": 28.5355,
            "lon": 77.2065,
            "timestamp": "2026-09-24T12:00:00Z"
        }
        evt = normalize_weather_event(raw, zone="Malviya Nagar")
        self.assertEqual(evt.source, "weather")
        self.assertEqual(evt.event_type, "rain")
        self.assertEqual(evt.value, 78.4)
        self.assertEqual(evt.unit, "mm/h")
        self.assertGreater(evt.severity, 0.9)

    def test_normalization_traffic(self):
        raw = {
            "congestion_level": 88,
            "average_speed": 4.2,
            "transit_delay": 26,
            "area": "Malviya Nagar",
            "lat": 28.5355,
            "lon": 77.2065,
            "timestamp": "2026-09-24T12:00:00Z"
        }
        evts = normalize_traffic_event(raw)
        self.assertEqual(len(evts), 2)
        types = {e.event_type for e in evts}
        self.assertIn("congestion", types)
        self.assertIn("transit_delay", types)

    def test_normalization_incident(self):
        raw = {
            "type": "waterlogging",
            "zone": "Malviya Nagar",
            "count": 14,
            "lat": 28.5355,
            "lon": 77.2065,
            "timestamp": "2026-09-24T12:00:00Z"
        }
        evt = normalize_incident_event(raw)
        self.assertEqual(evt.source, "incident")
        self.assertEqual(evt.event_type, "waterlogging")
        self.assertEqual(evt.value, 14)
        self.assertGreater(evt.severity, 0.8)

    def test_anomaly_detection(self):
        detector = AnomalyDetector(threshold=1.5)
        # Normal traffic reading
        evt_norm = UnifiedEvent(
            source="traffic",
            event_type="congestion",
            latitude=28.5355,
            longitude=77.2065,
            zone="Malviya Nagar",
            timestamp="2026-09-24T12:00:00Z",
            value=40.0,
            unit="%",
            severity=0.40
        )
        is_anom, val, base = detector.is_anomaly(evt_norm)
        self.assertFalse(is_anom)

        # Spiked traffic reading (88% vs baseline 42%)
        evt_spike = UnifiedEvent(
            source="traffic",
            event_type="congestion",
            latitude=28.5355,
            longitude=77.2065,
            zone="Malviya Nagar",
            timestamp="2026-09-24T12:05:00Z",
            value=88.0,
            unit="%",
            severity=0.88
        )
        is_anom_spike, _, _ = detector.is_anomaly(evt_spike)
        self.assertTrue(is_anom_spike)

    def test_haversine_distance(self):
        # Two locations in Malviya Nagar ~0.5 km apart
        lat1, lon1 = 28.5355, 77.2065
        lat2, lon2 = 28.5390, 77.2100
        dist = haversine_distance_km(lat1, lon1, lat2, lon2)
        self.assertLess(dist, 1.0)
        self.assertGreater(dist, 0.1)

        # Location far away in Rohini, North Delhi (~25 km away)
        lat_far, lon_far = 28.7041, 77.1025
        dist_far = haversine_distance_km(lat1, lon1, lat_far, lon_far)
        self.assertGreater(dist_far, 20.0)

    def test_geo_clustering(self):
        # 2 close events and 1 far event
        evt1 = UnifiedEvent(
            source="weather", event_type="rain", latitude=28.5355, longitude=77.2065,
            zone="Malviya", timestamp="2026-09-24T12:00:00Z", value=78.0, unit="mm/h", severity=1.0
        )
        evt2 = UnifiedEvent(
            source="traffic", event_type="congestion", latitude=28.5380, longitude=77.2090,
            zone="Malviya", timestamp="2026-09-24T12:05:00Z", value=88.0, unit="%", severity=0.88
        )
        evt_far = UnifiedEvent(
            source="traffic", event_type="congestion", latitude=28.7041, longitude=77.1025,
            zone="Rohini", timestamp="2026-09-24T12:05:00Z", value=85.0, unit="%", severity=0.85
        )

        clusters = filter_geo_correlated_events([evt1, evt2, evt_far], max_distance_km=2.0)
        self.assertEqual(len(clusters), 2)
        # First cluster has evt1 and evt2
        cluster_lengths = sorted([len(c) for c in clusters])
        self.assertEqual(cluster_lengths, [1, 2])

    def test_severity_confidence_separation(self):
        evt_w = UnifiedEvent(
            source="weather", event_type="rain", latitude=28.5355, longitude=77.2065,
            zone="Malviya", timestamp="2026-09-24T12:00:00Z", value=78.4, unit="mm/h", severity=0.98
        )
        evt_t = UnifiedEvent(
            source="traffic", event_type="congestion", latitude=28.5360, longitude=77.2070,
            zone="Malviya", timestamp="2026-09-24T12:05:00Z", value=88.0, unit="%", severity=0.88
        )
        evt_i = UnifiedEvent(
            source="incident", event_type="waterlogging", latitude=28.5350, longitude=77.2060,
            zone="Malviya", timestamp="2026-09-24T12:10:00Z", value=14.0, unit="reports", severity=0.93
        )

        sev, band, conf, spatial_km, temp_min = compute_severity_and_confidence([evt_w, evt_t, evt_i])

        # Severity and confidence must be distinct numbers
        self.assertNotEqual(sev, conf)
        self.assertEqual(band, "CRITICAL")
        self.assertGreater(sev, 0.8)
        self.assertGreaterEqual(conf, 0.90)

    def test_non_causal_summarizer(self):
        disruption = DisruptionEvent(
            id="test-1",
            zone="Malviya Nagar",
            severity="CRITICAL",
            severity_score=0.94,
            confidence=0.95,
            contributing_events=["w1", "t1", "i1"],
            spatial_overlap_km=0.5,
            temporal_overlap_minutes=10.0,
            created_at="2026-09-24T12:00:00Z"
        )
        raw_events = [
            UnifiedEvent(source="weather", event_type="rain", latitude=28.5355, longitude=77.2065, zone="Malviya", timestamp="2026-09-24T12:00:00Z", value=78.4, unit="mm/h", severity=1.0),
            UnifiedEvent(source="traffic", event_type="congestion", latitude=28.5355, longitude=77.2065, zone="Malviya", timestamp="2026-09-24T12:00:00Z", value=88.0, unit="%", severity=0.88),
            UnifiedEvent(source="incident", event_type="waterlogging", latitude=28.5355, longitude=77.2065, zone="Malviya", timestamp="2026-09-24T12:00:00Z", value=14.0, unit="reports", severity=0.93)
        ]
        res = generate_grounded_summary(disruption, raw_events)
        summary = res["summary"].lower()

        # Check non-causal language rules
        self.assertNotIn("caused by", summary)
        self.assertNotIn("due to", summary)
        self.assertNotIn("resulted in", summary)
        self.assertIn("coincides with", summary)

if __name__ == "__main__":
    unittest.main()
