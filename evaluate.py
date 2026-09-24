"""
evaluate.py - Leave-One-Event-Out (LOEO) Evaluation Runner for CityPulse.

Runs Leave-One-Event-Out evaluation across 4 nowcast variants:
1. Persistence Baseline
2. Weather-Only Nowcast
3. Full Features WITH hour_of_day
4. Full Features WITHOUT hour_of_day

Outputs reports/evaluation.md.
"""

from pathlib import Path

from features import build_feature_matrix
from models.nowcast import (
    eval_persistence_baseline,
    train_eval_nowcast_variant,
)


def generate_evaluation_report(data_dir: str = "data/raw") -> str:
    """
    Execute LOEO evaluation and generate reports/evaluation.md.

    The report is generated from the actual computed metrics.
    It does not assume that one model outperforms another.
    """

    # ---------------------------------------------------------
    # 1. Build feature matrix and target
    # ---------------------------------------------------------
    df, y = build_feature_matrix(data_dir)

    # ---------------------------------------------------------
    # 2. Persistence baseline
    # ---------------------------------------------------------
    p_res = eval_persistence_baseline(df)

    # ---------------------------------------------------------
    # 3. Weather-only model
    # ---------------------------------------------------------
    weather_cols = [
        "rainfall_mm",
        "rainfall_sum_1h",
        "rainfall_sum_3h",
    ]

    w_res = train_eval_nowcast_variant(
        df,
        weather_cols,
        model_type="hgb",
    )

    # ---------------------------------------------------------
    # 4. Full model WITH hour_of_day
    # ---------------------------------------------------------
    full_hod_cols = [
        "rainfall_mm",
        "rainfall_sum_1h",
        "rainfall_sum_3h",
        "speed_drop_pct",
        "vehicle_count",
        "waterlogging_count_t",
        "other_incidents_count_t",
        "hour_of_day",
    ]

    f_hod_res = train_eval_nowcast_variant(
        df,
        full_hod_cols,
        model_type="hgb",
    )

    # ---------------------------------------------------------
    # 5. Full model WITHOUT hour_of_day
    # ---------------------------------------------------------
    full_no_hod_cols = [
        "rainfall_mm",
        "rainfall_sum_1h",
        "rainfall_sum_3h",
        "speed_drop_pct",
        "vehicle_count",
        "waterlogging_count_t",
        "other_incidents_count_t",
    ]

    f_no_hod_res = train_eval_nowcast_variant(
        df,
        full_no_hod_cols,
        model_type="hgb",
    )

    # ---------------------------------------------------------
    # 6. Calculate actual comparisons
    # ---------------------------------------------------------
    weather_f1_difference = w_res["f1"] - p_res["f1"]
    weather_precision_difference = (
        w_res["precision"] - p_res["precision"]
    )

    hod_f1_difference = (
        f_no_hod_res["f1"] - f_hod_res["f1"]
    )

    hod_precision_difference = (
        f_no_hod_res["precision"] - f_hod_res["precision"]
    )

    # ---------------------------------------------------------
    # 7. Generate neutral, data-driven findings
    # ---------------------------------------------------------
    if weather_f1_difference > 0:
        weather_finding = (
            f"Weather-Only has a higher mean F1 than Persistence "
            f"({w_res['f1']:.4f} vs {p_res['f1']:.4f}), "
            f"a difference of {weather_f1_difference:+.4f}."
        )
    elif weather_f1_difference < 0:
        weather_finding = (
            f"Weather-Only has a lower mean F1 than Persistence "
            f"({w_res['f1']:.4f} vs {p_res['f1']:.4f}), "
            f"a difference of {weather_f1_difference:+.4f}."
        )
    else:
        weather_finding = (
            f"Weather-Only and Persistence have the same mean F1 "
            f"({w_res['f1']:.4f})."
        )

    if weather_precision_difference > 0:
        precision_finding = (
            f"Weather-Only precision is higher than Persistence "
            f"({w_res['precision']:.4f} vs {p_res['precision']:.4f})."
        )
    elif weather_precision_difference < 0:
        precision_finding = (
            f"Weather-Only precision is lower than Persistence "
            f"({w_res['precision']:.4f} vs {p_res['precision']:.4f})."
        )
    else:
        precision_finding = (
            f"Weather-Only and Persistence have the same precision "
            f"({w_res['precision']:.4f})."
        )

    if hod_f1_difference > 0:
        hod_f1_finding = (
            f"Removing hour_of_day increases mean F1 "
            f"from {f_hod_res['f1']:.4f} to {f_no_hod_res['f1']:.4f}."
        )
    elif hod_f1_difference < 0:
        hod_f1_finding = (
            f"Removing hour_of_day decreases mean F1 "
            f"from {f_hod_res['f1']:.4f} to {f_no_hod_res['f1']:.4f}."
        )
    else:
        hod_f1_finding = (
            f"Removing hour_of_day produces the same mean F1 "
            f"({f_hod_res['f1']:.4f})."
        )

    if hod_precision_difference > 0:
        hod_precision_finding = (
            f"Removing hour_of_day increases mean precision "
            f"from {f_hod_res['precision']:.4f} "
            f"to {f_no_hod_res['precision']:.4f}."
        )
    elif hod_precision_difference < 0:
        hod_precision_finding = (
            f"Removing hour_of_day decreases mean precision "
            f"from {f_hod_res['precision']:.4f} "
            f"to {f_no_hod_res['precision']:.4f}."
        )
    else:
        hod_precision_finding = (
            f"Removing hour_of_day produces the same mean precision "
            f"({f_hod_res['precision']:.4f})."
        )

    # ---------------------------------------------------------
    # 8. Build evaluation report
    # ---------------------------------------------------------
    md_content = f"""# CityPulse Intelligence Engine - Phase 2 LOEO Evaluation Report

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
| Persistence Baseline | Current disruption signals | {p_res['f1']:.4f} | {p_res['recall']:.4f} | {p_res['precision']:.4f} | {p_res['auc']:.4f} | {p_res['onset_recall']:.4f} |
| Weather-Only Nowcast | Rain 1h/3h sums | {w_res['f1']:.4f} | {w_res['recall']:.4f} | {w_res['precision']:.4f} | {w_res['auc']:.4f} | {w_res['onset_recall']:.4f} |
| Full Features WITH `hour_of_day` | All features + HOD | {f_hod_res['f1']:.4f} | {f_hod_res['recall']:.4f} | {f_hod_res['precision']:.4f} | {f_hod_res['auc']:.4f} | {f_hod_res['onset_recall']:.4f} |
| Full Features WITHOUT `hour_of_day` | All features excluding HOD | {f_no_hod_res['f1']:.4f} | {f_no_hod_res['recall']:.4f} | {f_no_hod_res['precision']:.4f} | {f_no_hod_res['auc']:.4f} | {f_no_hod_res['onset_recall']:.4f} |

---

## 2. Empirical Findings

### Weather-Only vs Persistence

{weather_finding}

{precision_finding}

These results describe the measured performance on the available dataset.
They do not by themselves establish that the Weather-Only model provides
a generalizable early-warning advantage.

### Effect of `hour_of_day`

{hod_f1_finding}

{hod_precision_finding}

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

"""

    # Add fold-level persistence results.
    for fold in p_res["fold_details"]:
        md_content += (
            f"- {fold['test_date']}: "
            f"F1={fold['f1']:.4f}, "
            f"Recall={fold['recall']:.4f}, "
            f"Precision={fold['precision']:.4f}\\n"
        )

    md_content += """
### Weather-Only Nowcast

"""

    for fold in w_res["fold_details"]:
        md_content += (
            f"- {fold['test_date']}: "
            f"F1={fold['f1']:.4f}, "
            f"Recall={fold['recall']:.4f}, "
            f"Precision={fold['precision']:.4f}\\n"
        )

    md_content += """
### Full Features WITH `hour_of_day`

"""

    for fold in f_hod_res["fold_details"]:
        md_content += (
            f"- {fold['test_date']}: "
            f"F1={fold['f1']:.4f}, "
            f"Recall={fold['recall']:.4f}, "
            f"Precision={fold['precision']:.4f}\\n"
        )

    md_content += """
### Full Features WITHOUT `hour_of_day`

"""

    for fold in f_no_hod_res["fold_details"]:
        md_content += (
            f"- {fold['test_date']}: "
            f"F1={fold['f1']:.4f}, "
            f"Recall={fold['recall']:.4f}, "
            f"Precision={fold['precision']:.4f}\\n"
        )

    # ---------------------------------------------------------
    # 9. Save report
    # ---------------------------------------------------------
    report_path = Path("reports/evaluation.md")
    report_path.parent.mkdir(parents=True, exist_ok=True)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(
        f"Evaluation report successfully saved to: "
        f"{report_path.resolve()}"
    )

    return md_content


if __name__ == "__main__":
    generate_evaluation_report("data/raw")