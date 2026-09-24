# CityPulse ML Engine - Block 0: Exploratory Data Analysis (EDA) Report

## Executive Summary
This report presents the empirical findings from analyzing the synthetic Jaipur city dataset (`data/raw/`). The analysis confirms zero missing values, isolates the two distinct heavy rain disruption events, proves deterministic label leakage between traffic speed and `congestion_level`, measures per-zone sensitivity to rainfall, establishes the exact weak label formulation, and identifies key domain ambiguities for pipeline design.

---

## 1. Dataset Overview & Data Completeness

| Dataset | Rows | Columns | Time Range Start | Time Range End | Missing Values | Key Primary / Join Fields |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `zones.csv` | 10 | 4 | Static | Static | 0 | `zone_id`, `zone_name`, `latitude`, `longitude` |
| `weather.csv` | 1,680 | 9 | 2026-09-18 00:00 | 2026-09-24 23:00 | 0 | `timestamp` (hourly), `zone_id`, `rainfall_mm` |
| `traffic.csv` | 3,360 | 8 | 2026-09-18 00:00 | 2026-09-24 23:30 | 0 | `timestamp` (30-min), `zone_id`, `avg_speed_kmph`, `congestion_level` |
| `incidents.csv` | 189 | 9 | 2026-09-18 00:30 | 2026-09-24 23:00 | 0 | `timestamp` (event), `zone_id`, `incident_type`, `severity`, `status` |

---

## 2. Rain Event Windows & Waterlogging Incident Clustering

Heavy rainfall ($> 3.0$ mm/h) occurs in exactly **two multi-hour episodes** affecting all 10 city zones simultaneously:

1. **Rain Event 1**: `2026-09-20 14:00:00` to `2026-09-20 19:00:00` (6 hours; mean rainfall 16.7 – 36.1 mm/h, peak 41.9 mm/h).
2. **Rain Event 2**: `2026-09-23 15:00:00` to `2026-09-23 20:00:00` (6 hours; mean rainfall 16.9 – 35.8 mm/h, peak 43.8 mm/h).

### Waterlogging Temporal Alignment
- Total Waterlogging Incidents: **62**
- Waterlogging on Event 1 (2026-09-20): **28 incidents** (100% within 14:00–19:30)
- Waterlogging on Event 2 (2026-09-23): **34 incidents** (100% within 15:00–20:30)
- Waterlogging on non-rain days: **0 incidents**

**Finding**: Waterlogging incidents cluster 100% inside rain event windows. Non-waterlogging incidents (48 signal failures, 41 accidents, 38 road blockages) are distributed continuously across normal and rain days.

---

## 3. Traffic Speed vs. `congestion_level` (Label Leakage Check)

Analysis of `avg_speed_kmph` grouped by `congestion_level` reveals strict, deterministic cutoffs:

| Congestion Level | Row Count | Speed Range (km/h) | Mean Speed (km/h) | Std Dev (km/h) |
| :--- | :--- | :--- | :--- | :--- |
| **LOW** | 2,980 | 32.0 – 48.8 | 39.92 | 3.90 |
| **MEDIUM** | 231 | 22.1 – 32.0 | 29.37 | 2.84 |
| **HIGH** | 149 | 8.0 – 22.0 | 16.49 | 3.43 |

> [!WARNING]
> **Label Leakage Alert**: `congestion_level` is 100% deterministically computed from `avg_speed_kmph` ($\le 22.0$ km/h $\implies$ HIGH, $22.1 - 32.0$ km/h $\implies$ MEDIUM, $> 32.0$ km/h $\implies$ LOW).
> **Rule**: `congestion_level` and current `avg_speed_kmph` / immediate speed drop must **NEVER** be used as predictor features when training the disruption classifier or forecasting speed drops.

---

## 4. Per-Zone Baseline Speeds & Rain Sensitivity

During normal dry periods, average traffic speed is consistent ($\approx 39.3 - 39.8$ km/h) across all 10 zones. During heavy rain events, traffic speeds drop sharply across all zones by **45.3% to 50.8%**.

| Zone ID | Zone Name | Normal Speed (km/h) | Rain Speed (km/h) | Speed Drop (%) | Waterlogging Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Z01** | Tonk Road | 39.44 | 20.70 | **47.50%** | 6 |
| **Z02** | Malviya Nagar | 39.36 | 20.51 | **47.90%** | 6 |
| **Z03** | C-Scheme | 39.44 | 21.57 | **45.32%** | 5 |
| **Z04** | Vaishali Nagar | 39.57 | 20.98 | **46.99%** | 8 |
| **Z05** | Mansarovar | 39.52 | 20.48 | **48.17%** | 4 |
| **Z06** | Raja Park | 39.53 | 19.46 | **50.77%** | 6 |
| **Z07** | Jagatpura | 39.27 | 20.39 | **48.08%** | 5 |
| **Z08** | Jhotwara | 39.79 | 21.45 | **46.09%** | 4 |
| **Z09** | Sodala | 39.55 | 21.35 | **46.01%** | 8 |
| **Z10** | Bani Park | 39.44 | 20.46 | **48.12%** | 10 |

**Finding**: All zones experience major congestion during rain, with **Z06 (Raja Park)** experiencing the largest drop (50.77%) and **Z10 (Bani Park)** experiencing the highest count of waterlogging incidents (10).

---

## 5. Weak Label Definition & Feature Exclusion List

### Weak Label Formulation ($Y_{z, t}$)
For a given zone $z$ at 30-min timestamp $t$:
$$\text{Disruption}_{z,t} = 1 \iff \left( \text{Waterlogging\_Count}_{[t-60\text{m}, t]} \ge 1 \right) \land \left( \frac{\text{Baseline\_Speed}_z - \text{Speed}_{z,t}}{\text{Baseline\_Speed}_z} > 0.25 \right)$$

### Excluded Features (Target / Weak Label Leakage)
To ensure the supervised model predicts future disruptions without cheating, the following variables at time $t$ are strictly **excluded** from the feature matrix:
- `avg_speed_kmph` at time $t$
- `speed_drop_pct` at time $t$
- `congestion_level` at time $t$
- `waterlogging_count` at time $t$
- `incident_count` at time $t$

### Allowed Feature Vector ($X_{z, t}$ for early-warning / nowcasting $t \to t+30..60\text{m}$)
- Current & rolling rainfall: `rainfall_mm` ($t$), `rainfall_sum_1h` ($t$), `rainfall_sum_3h` ($t$)
- Historical lag traffic: `speed_drop_pct` ($t-30\text{m}$), `vehicle_count` ($t-30\text{m}$)
- Historical lag incidents: `waterlogging_count` ($[t-60\text{m}, t-30\text{m}]$), `other_incidents_count` ($[t-60\text{m}, t-30\text{m}]$)
- Candidate contextual feature: `hour_of_day` (tested with/without via ablation)

---

## 6. Real Ambiguities & Engineering Decisions Identified

1. **Simultaneous Multi-Zone Rain Alerts**:
   - *Ambiguity*: Weather data feeds rainfall simultaneously across all 10 zones during both rain episodes.
   - *Decision*: Correlation engine will cluster simultaneous zone alerts into a single consolidated **City-Wide Disruption Alert** to prevent UI flood on the map.
2. **Static `ACTIVE` Status on Incidents**:
   - *Ambiguity*: All 189 incident rows in `incidents.csv` have `status == 'ACTIVE'` without explicit `closed_at` timestamps.
   - *Decision*: Model active incidents using a rolling lookback window ($\Delta t = 60$ minutes).
3. **Time-of-Day Collinearity Risk**:
   - *Ambiguity*: Both rain events occurred during afternoon hours (14:00–20:00). A model using `hour_of_day` could learn a spurious correlation.
   - *Decision*: Include an ablation study evaluating early warning performance with and without `hour_of_day`.
4. **Baseline Cold-Start (First 24 Hours)**:
   - *Ambiguity*: During the first 24 hours (Sep 18), rolling per-zone historical windows have $< 48$ points.
   - *Decision*: Use global city median as fallback until 24 hours of history accumulate.
