# CityPulse Intelligence Engine - Phase 2 LOEO Evaluation Report

## Executive Summary

This report presents Leave-One-Event-Out (LOEO) evaluation results for four
nowcast variants:

1. Persistence Baseline
2. Weather-Only Nowcast
3. Full Features WITH `hour_of_day`
4. Full Features WITHOUT `hour_of_day`

The evaluation uses the two rain-event dates present in the dataset:

- September 20, 2026
- September 23, 2026

Each rain event is held out in turn while the other available observations
are used for training.

The reported values below are computed directly from the evaluation run.

---

## 1. LOEO Method Comparison

| Model Variant | Feature Set | F1 Score | Recall | Precision | ROC AUC | Disruption Onset Detection |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| Persistence Baseline | Current disruption signals | 0.8899 | 0.8899 | 0.8899 | 0.5000 | 0.0000 |
| Weather-Only Nowcast | Rain 1h/3h sums | 0.9032 | 0.8635 | 0.9468 | 0.9588 | 0.1186 |
| Full Features WITH `hour_of_day` | All features + HOD | 0.8997 | 0.8717 | 0.9331 | 0.9650 | 0.1571 |
| Full Features WITHOUT `hour_of_day` | All features excluding HOD | 0.8990 | 0.8634 | 0.9377 | 0.9634 | 0.0801 |

---

## 2. Empirical Findings

### Weather-Only vs Persistence

Weather-Only has a higher mean F1 than Persistence (0.9032 vs 0.8899), a difference of +0.0133.

Weather-Only precision is higher than Persistence (0.9468 vs 0.8899).

These results describe the measured performance on the available dataset.
They do not by themselves establish that the Weather-Only model provides
a generalizable early-warning advantage.

### Effect of `hour_of_day`

Removing hour_of_day decreases mean F1 from 0.8997 to 0.8990.

Removing hour_of_day increases mean precision from 0.9331 to 0.9377.

The difference should be interpreted as an observation from this evaluation,
not as proof of or against time-of-day overfitting.

---

## 3. Dataset and Methodological Limitations

### 3.1 Only Two Rain Events

The dataset contains two rain-event dates:

- September 20, 2026
- September 23, 2026

Therefore, the LOEO evaluation contains only two event-level folds.

The results should be treated as an evaluation of this synthetic dataset,
not as evidence of production-level generalization.

### 3.2 Phase 1 Threshold Selection

The Phase 1 rule-based thresholds include:

- Rainfall threshold: 5.0 mm
- Speed-drop threshold: 25%
- Traffic-speed threshold: 30.0 km/h

These thresholds were selected using the available synthetic demonstration
data. Therefore, Phase 1 rule-based metrics may be optimistic.

### 3.3 Label Definition

The disruption target is generated from the implementation in
`features.py`.

The implemented label uses an OR condition:

- future speed drop > 25%, OR
- future waterlogging count > 0

The exact prediction window is determined by the feature-builder implementation.

### 3.4 Baseline Definition

The Persistence Baseline uses the current disruption indicators to predict
the future disruption target.

It should therefore be interpreted as a persistence/reference benchmark,
not as an independent machine-learning model.

### 3.5 Onset Recall

Onset detection is reported separately from the standard classification
metrics. Its exact interpretation depends on the implementation in
`models/nowcast.py`.

### 3.6 Threshold and Dataset Limitations

The dataset is synthetic and contains only two rain events. Feature
thresholds and model behavior may therefore be sensitive to this particular
dataset.

Further evaluation on additional independent rain events is required before
making claims about real-world performance.

---

## 4. Event-Level Results

### Persistence Baseline

- 2026-09-20: F1=0.8870, Recall=0.8870, Precision=0.8870\n- 2026-09-23: F1=0.8929, Recall=0.8929, Precision=0.8929\n
### Weather-Only Nowcast

- 2026-09-20: F1=0.9041, Recall=0.8609, Precision=0.9519\n- 2026-09-23: F1=0.9023, Recall=0.8661, Precision=0.9417\n
### Full Features WITH `hour_of_day`

- 2026-09-20: F1=0.9052, Recall=0.9130, Precision=0.8974\n- 2026-09-23: F1=0.8942, Recall=0.8304, Precision=0.9688\n
### Full Features WITHOUT `hour_of_day`

- 2026-09-20: F1=0.9050, Recall=0.8696, Precision=0.9434\n- 2026-09-23: F1=0.8930, Recall=0.8571, Precision=0.9320\n