from typing import Dict, Tuple, List
from collections import defaultdict
from models.events import UnifiedEvent

class AnomalyDetector:
    def __init__(self, threshold: float = 1.5):
        self.threshold = threshold
        # History store: (source, event_type, zone) -> list of normal values
        self.history: Dict[Tuple[str, str, str], List[float]] = defaultdict(list)
        # Standard normal baselines from historical telemetry
        self.default_baselines: Dict[Tuple[str, str], float] = {
            ("weather", "rain"): 5.0,           # normal is < 5 mm/h
            ("traffic", "congestion"): 42.0,    # normal traffic average is 42%
            ("traffic", "transit_delay"): 4.0,  # normal transit delay is 2-4 min
            ("incident", "waterlogging"): 1.5,  # normal is 0-1 complaints
            ("incident", "road_damage"): 1.5,
            ("incident", "power_outage"): 1.0,
            ("incident", "noise_complaint"): 2.0,
        }

    def get_baseline(self, source: str, event_type: str, zone: str) -> float:
        key = (source, event_type, zone)
        hist = self.history.get(key, [])
        if len(hist) >= 3:
            return sum(hist[-10:]) / len(hist[-10:])
        return self.default_baselines.get((source, event_type), 10.0)

    def is_anomaly(self, event: UnifiedEvent) -> Tuple[bool, float, float]:
        """
        Returns (is_anomaly, current_value, rolling_average).
        Flag anomaly = true when current_value > rolling_average * threshold.
        """
        baseline = self.get_baseline(event.source, event.event_type, event.zone)

        # Rain sudden surge check (> 25 mm/h is always an absolute weather anomaly)
        if event.source == "weather" and event.event_type == "rain" and event.value >= 25.0:
            anomaly_flag = True
        else:
            anomaly_flag = event.value > (baseline * self.threshold)

        # Only update baseline history if it is a normal reading, preventing baseline pollution
        if not anomaly_flag:
            key = (event.source, event.event_type, event.zone)
            self.history[key].append(event.value)

        return anomaly_flag, event.value, baseline
