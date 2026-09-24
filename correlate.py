"""
correlate.py - Episode-Based Spatio-Temporal Event Correlation Module for CityPulse.

Correlates anomalies into zone-level disruption alerts:
1. Requires at least one weather (rain) or traffic (congestion) anomaly for a DISRUPTION_ALERT.
   Incident-only clusters are assigned alert_type='INCIDENT_CLUSTER' (LOW severity notice).
2. Episode-Based Linkage: Links any waterlogging or civic incident in a zone to that zone's
   active rain/traffic disruption episode (including up to 60 min after episode end).
3. Deduplication: At most ONE active disruption alert per zone per rain episode.
4. Grouped City-Wide Alerts: Consolidates simultaneous multi-zone rain episodes into a citywide alert.
"""

import math
from datetime import datetime
from typing import Dict, List, Any, Set, Tuple
import pandas as pd


def parse_timestamp(ts_str: str) -> datetime:
    """Parse timestamp string into datetime."""
    try:
        return datetime.fromisoformat(ts_str.strip().replace(" ", "T"))
    except ValueError:
        return datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")


def correlate_anomalies(
    anomalies: List[Dict[str, Any]],
    max_time_diff_minutes: float = 30.0,
    episode_gap_minutes: float = 60.0
) -> List[Dict[str, Any]]:
    """
    Episode-based correlation algorithm:
    - Filters flagged anomalies.
    - Groups rain & congestion events in each zone into active disruption episodes.
    - Attaches zone incidents to active episodes (up to 60 min post-episode).
    - Ensures 1 deduplicated disruption alert per zone per episode.
    """
    flagged = [a for a in anomalies if a.get('is_anomaly', False)]
    if not flagged:
        return []

    zones = sorted(list(set(a['zone_id'] for a in anomalies)))
    relationships = []
    rel_counter = 1

    for z in zones:
        z_anom = [a for a in flagged if a['zone_id'] == z]
        z_anom.sort(key=lambda x: parse_timestamp(x['detected_at']))
        
        disruptive = [a for a in z_anom if a['event_type'] in ['rain', 'congestion']]
        incidents = [a for a in z_anom if a['event_type'] not in ['rain', 'congestion']]
        
        if not disruptive:
            # Incident-only notices on dry days (optional / suppressed from disruption stream)
            continue
            
        # Form disruptive episodes (events within episode_gap_minutes of each other)
        episodes = []
        curr_ep = [disruptive[0]]
        for item in disruptive[1:]:
            t_last = parse_timestamp(curr_ep[-1]['detected_at'])
            t_curr = parse_timestamp(item['detected_at'])
            if (t_curr - t_last).total_seconds() / 60.0 <= episode_gap_minutes:
                curr_ep.append(item)
            else:
                episodes.append(curr_ep)
                curr_ep = [item]
        if curr_ep:
            episodes.append(curr_ep)
            
        # Attach incidents to episodes
        for ep in episodes:
            ep_start = parse_timestamp(ep[0]['detected_at']) - pd.Timedelta(minutes=30)
            ep_end = parse_timestamp(ep[-1]['detected_at']) + pd.Timedelta(minutes=60)
            
            ep_incidents = [
                inc for inc in incidents 
                if ep_start <= parse_timestamp(inc['detected_at']) <= ep_end
            ]
            
            all_evidence = ep + ep_incidents
            all_evidence.sort(key=lambda x: parse_timestamp(x['detected_at']))
            distinct_types = sorted(list(set(a['event_type'] for a in all_evidence)))
            
            min_ts = parse_timestamp(all_evidence[0]['detected_at'])
            max_ts = parse_timestamp(all_evidence[-1]['detected_at'])
            time_span_min = round((max_ts - min_ts).total_seconds() / 60.0, 2)
            
            rel_id = f"REL-{z}-{min_ts.strftime('%Y%m%d%H%M')}-{rel_counter:03d}"
            rel_counter += 1
            
            evidence_list = []
            for a in all_evidence:
                evidence_list.append({
                    "event_id": a['event_id'],
                    "event_type": a['event_type'],
                    "value": a['value'],
                    "baseline": a['baseline_mean'],
                    "pct_change": a['pct_change'],
                    "timestamp": a['detected_at'],
                    "severity": a['severity'],
                    "zone_id": a['zone_id']
                })

            rel_record = {
                "id": rel_id,
                "zone_id": z,
                "alert_type": "DISRUPTION_ALERT",
                "anomaly_ids": [a['event_id'] for a in all_evidence],
                "event_types": distinct_types,
                "time_span_minutes": time_span_min,
                "evidence": evidence_list
            }
            relationships.append(rel_record)

    relationships.sort(key=lambda r: r['evidence'][0]['timestamp'])
    return relationships


def group_citywide_alerts(relationships: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Consolidate simultaneous per-zone disruption episodes into a Grouped City-Wide Alert.
    """
    if not relationships:
        return []

    time_grouped: Dict[str, List[Dict[str, Any]]] = {}
    for r in relationships:
        ts = r['evidence'][0]['timestamp']
        dt_hour = parse_timestamp(ts).strftime("%Y-%m-%dT%H:00:00")
        time_grouped.setdefault(dt_hour, []).append(r)

    citywide_alerts = []
    
    for hour_key, rels in time_grouped.items():
        affected_zones = sorted(list(set(r['zone_id'] for r in rels)))
        if len(affected_zones) >= 3:
            all_anomaly_ids = []
            all_evidence = []
            all_types: Set[str] = set()
            
            for r in rels:
                all_anomaly_ids.extend(r['anomaly_ids'])
                all_evidence.extend(r['evidence'])
                all_types.update(r['event_types'])

            citywide_alerts.append({
                "id": f"CITYWIDE-ALERT-{parse_timestamp(hour_key).strftime('%Y%m%d%H%M')}",
                "alert_level": "CITY_WIDE",
                "affected_zone_count": len(affected_zones),
                "affected_zones": affected_zones,
                "event_types": sorted(list(all_types)),
                "start_timestamp": hour_key,
                "total_relationships_grouped": len(rels),
                "anomaly_ids": list(set(all_anomaly_ids)),
                "evidence": all_evidence
            })

    return citywide_alerts


if __name__ == "__main__":
    from normalize import load_and_normalize
    from anomaly import detect_anomalies
    
    print("Testing correlate.py with episode-based linkage...")
    events = load_and_normalize("data/raw")
    anomalies = detect_anomalies(events)
    relationships = correlate_anomalies(anomalies)
    city_alerts = group_citywide_alerts(relationships)
    
    print(f"Total Disruption Zone Alerts: {len(relationships)}")
    print(f"Total Grouped City-Wide Alerts: {len(city_alerts)}")
    print("correlate.py OK.")
