CityPulse Demo Dataset

Files:
- zones.csv: 10 demo zones with approximate coordinates.
- weather.csv: 7 days of hourly synthetic weather observations.
- traffic.csv: 7 days of 30-minute synthetic traffic observations.
- incidents.csv: synthetic civic incidents.

IMPORTANT:
All four files are synthetic demo data created for the CityPulse hackathon MVP.
They are designed so that two rain windows correlate with increased waterlogging
and traffic congestion. They are NOT official Jaipur civic records.

Recommended demo chain:
Heavy rainfall -> waterlogging incidents increase -> average traffic speed drops
-> congestion rises.

Common join keys:
- zone_id
- timestamp (use nearest/rolling time window when joining different frequencies)
- latitude/longitude
