"""
models/nowcast.py - Supervised Early-Warning Nowcaster for CityPulse.

Implements supervised models (LogisticRegression and HistGradientBoostingClassifier)
and baseline benchmarks under Leave-One-Event-Out (LOEO) cross validation.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (
    recall_score,
    precision_score,
    f1_score,
    roc_auc_score,
)


def _calculate_onset_recall(
    df: pd.DataFrame,
    y_true: pd.Series,
    y_pred: np.ndarray,
) -> float:
    """
    Calculate recall specifically at the beginning of each
    disruption episode.

    An onset is the first positive target row after a non-positive
    target row within each zone.

    This is different from normal recall, which evaluates every
    positive row.
    """

    eval_df = df.loc[
        y_true.index,
        ["zone_id", "timestamp_dt"]
    ].copy()

    eval_df["actual"] = y_true.astype(int).values
    eval_df["predicted"] = y_pred.astype(int)

    eval_df = eval_df.sort_values(
        ["zone_id", "timestamp_dt"]
    )

    previous_actual = (
        eval_df
        .groupby("zone_id")["actual"]
        .shift(1)
        .fillna(0)
    )

    onset_mask = (
        (eval_df["actual"] == 1)
        & (previous_actual == 0)
    )

    if onset_mask.sum() == 0:
        return 0.0

    onset_actual = eval_df.loc[onset_mask, "actual"]
    onset_predicted = eval_df.loc[onset_mask, "predicted"]

    return recall_score(
        onset_actual,
        onset_predicted,
        zero_division=0,
    )


def train_eval_nowcast_variant(
    df: pd.DataFrame,
    feature_cols: List[str],
    model_type: str = "hgb"
) -> Dict[str, Any]:
    """
    Run Leave-One-Event-Out (LOEO) evaluation for a feature column set.

    Fold 1:
        Train on Event 2 (Sep 23) + Dry Days
        Test on Event 1 (Sep 20)

    Fold 2:
        Train on Event 1 (Sep 20) + Dry Days
        Test on Event 2 (Sep 23)
    """

    date_sep20 = pd.to_datetime("2026-09-20").date()
    date_sep23 = pd.to_datetime("2026-09-23").date()

    fold_results = []

    for test_date, train_event_date in [
        (date_sep20, date_sep23),
        (date_sep23, date_sep20),
    ]:

        train_mask = df["date"] != test_date
        test_mask = df["date"] == test_date

        X_train = df.loc[train_mask, feature_cols]
        y_train = df.loc[
            train_mask,
            "target_disruption"
        ]

        X_test = df.loc[test_mask, feature_cols]
        y_test = df.loc[
            test_mask,
            "target_disruption"
        ]

        if model_type == "logistic":
            model = LogisticRegression(
                max_iter=1000,
                random_state=42,
            )
        else:
            model = HistGradientBoostingClassifier(
                random_state=42
            )

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)

        if hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(X_test)[:, 1]
        else:
            y_prob = y_pred

        rec = recall_score(
            y_test,
            y_pred,
            zero_division=0,
        )

        prec = precision_score(
            y_test,
            y_pred,
            zero_division=0,
        )

        f1 = f1_score(
            y_test,
            y_pred,
            zero_division=0,
        )

        if len(np.unique(y_test)) > 1:
            auc = roc_auc_score(
                y_test,
                y_prob,
            )
        else:
            auc = 0.5

        # Calculate recall only at the beginning of
        # each disruption episode.
        onset_rec = _calculate_onset_recall(
            df.loc[test_mask],
            y_test,
            y_pred,
        )

        fold_results.append({
            "test_date": str(test_date),
            "train_event_date": str(train_event_date),
            "recall": rec,
            "precision": prec,
            "f1": f1,
            "auc": auc,
            "onset_recall": onset_rec,
        })

    avg_f1 = sum(
        r["f1"] for r in fold_results
    ) / len(fold_results)

    avg_rec = sum(
        r["recall"] for r in fold_results
    ) / len(fold_results)

    avg_prec = sum(
        r["precision"] for r in fold_results
    ) / len(fold_results)

    avg_auc = sum(
        r["auc"] for r in fold_results
    ) / len(fold_results)

    avg_onset = sum(
        r["onset_recall"] for r in fold_results
    ) / len(fold_results)

    return {
        "model_type": model_type,
        "feature_count": len(feature_cols),
        "f1": round(avg_f1, 4),
        "recall": round(avg_rec, 4),
        "precision": round(avg_prec, 4),
        "auc": round(avg_auc, 4),
        "onset_recall": round(avg_onset, 4),
        "fold_details": fold_results,
    }


def eval_persistence_baseline(
    df: pd.DataFrame
) -> Dict[str, Any]:
    """
    Evaluate the Persistence Baseline.

    Prediction at time t:
        1 if current speed_drop_pct > 25%
        OR current waterlogging_count_t > 0.

    This baseline checks whether an already-observed disruption
    persists into the future target window.
    """

    date_sep20 = pd.to_datetime("2026-09-20").date()
    date_sep23 = pd.to_datetime("2026-09-23").date()

    fold_results = []

    for test_date in [
        date_sep20,
        date_sep23,
    ]:

        test_df = df[
            df["date"] == test_date
        ]

        y_test = test_df[
            "target_disruption"
        ]

        y_pred = (
            (test_df["speed_drop_pct"] > 25.0)
            |
            (test_df["waterlogging_count_t"] > 0)
        ).astype(int)

        rec = recall_score(
            y_test,
            y_pred,
            zero_division=0,
        )

        prec = precision_score(
            y_test,
            y_pred,
            zero_division=0,
        )

        f1 = f1_score(
            y_test,
            y_pred,
            zero_division=0,
        )

        onset_rec = _calculate_onset_recall(
            test_df,
            y_test,
            y_pred.to_numpy(),
        )

        fold_results.append({
            "test_date": str(test_date),
            "recall": rec,
            "precision": prec,
            "f1": f1,
            "auc": 0.5,
            "onset_recall": onset_rec,
        })

    avg_f1 = sum(
        r["f1"] for r in fold_results
    ) / len(fold_results)

    avg_rec = sum(
        r["recall"] for r in fold_results
    ) / len(fold_results)

    avg_prec = sum(
        r["precision"] for r in fold_results
    ) / len(fold_results)

    avg_onset = sum(
        r["onset_recall"] for r in fold_results
    ) / len(fold_results)

    return {
        "model_type": "persistence",
        "feature_count": 2,
        "f1": round(avg_f1, 4),
        "recall": round(avg_rec, 4),
        "precision": round(avg_prec, 4),
        "auc": 0.5000,
        "onset_recall": round(avg_onset, 4),
        "fold_details": fold_results,
    }


if __name__ == "__main__":
    from features import build_feature_matrix

    print("Testing models/nowcast.py...")

    df, y = build_feature_matrix("data/raw")

    pers_res = eval_persistence_baseline(df)

    print(
        "Persistence Baseline Results:",
        pers_res
    )

    print("nowcast.py OK.")