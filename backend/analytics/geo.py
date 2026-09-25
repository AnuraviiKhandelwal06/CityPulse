import math
from typing import List
from models.events import UnifiedEvent

EARTH_RADIUS_KM = 6371.0

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes exact haversine spherical distance between two lat/lon coordinates in kilometers.
    """
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def filter_geo_correlated_events(events: List[UnifiedEvent], max_distance_km: float = 2.0) -> List[List[UnifiedEvent]]:
    """
    Clusters events whose pairwise geographic distance is <= max_distance_km.
    Events farther apart than max_distance_km are separated into distinct clusters.
    """
    if not events:
        return []

    clusters: List[List[UnifiedEvent]] = []
    visited = set()

    for i, evt1 in enumerate(events):
        if i in visited:
            continue
        cluster = [evt1]
        visited.add(i)

        for j, evt2 in enumerate(events):
            if j in visited:
                continue
            dist = haversine_distance_km(evt1.latitude, evt1.longitude, evt2.latitude, evt2.longitude)
            if dist <= max_distance_km:
                cluster.append(evt2)
                visited.add(j)

        clusters.append(cluster)

    return clusters
