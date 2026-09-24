"""
features.py - Feature Engineering Module for CityPulse Early-Warning Nowcasting.

Constructs feature matrix X_{z,t} at forecast time t to predict
disruption label Y_{z,t+30..60m}.
"""

from typing import Tuple

import numpy as np
import pandas as pd


def build_feature_matrix(
    data_dir: str = "data/raw",
    forecast_horizon_minutes: int = 30
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Build feature matrix X and target series Y for disruption nowcasting.

    Target:
        Y_{z,t+30..60m} = 1 if, during the future
        [t+30m, t+60m] window:

        - waterlogging_count > 0
          OR
        - speed_drop_pct > 25%

    The dataset is sampled every 30 minutes, so the target window
    contains the next two observations:

        t+30
        t+60

    Predictor X_{z,t} uses only information available at time t.
    """

    if forecast_horizon_minutes <= 0:
        raise ValueError("forecast_horizon_minutes must be greater than 0.")

    # ---------------------------------------------------------
    # 1. Load datasets
    # ---------------------------------------------------------
    weather = pd.read_csv(f"{data_dir}/weather.csv")
    traffic = pd.read_csv(f"{data_dir}/traffic.csv")
    incidents = pd.read_csv(f"{data_dir}/incidents.csv")
    zones = pd.read_csv(f"{data_dir}/zones.csv")

    # Keep zones referenced so the input contract remains explicit.
    _ = zones

    # ---------------------------------------------------------
    # 2. Parse timestamps
    # ---------------------------------------------------------
    weather["timestamp_dt"] = pd.to_datetime(weather["timestamp"])
    traffic["timestamp_dt"] = pd.to_datetime(traffic["timestamp"])
    incidents["timestamp_dt"] = pd.to_datetime(incidents["timestamp"])

    # ---------------------------------------------------------
    # 3. Merge hourly weather onto 30-minute traffic records
    # ---------------------------------------------------------
    traffic["hourly_ts"] = traffic["timestamp_dt"].dt.floor("h")

    df = pd.merge(
        traffic,
        weather[
            ["timestamp_dt", "zone_id", "rainfall_mm"]
        ],
        left_on=["hourly_ts", "zone_id"],
        right_on=["timestamp_dt", "zone_id"],
        suffixes=("", "_w")
    )

    # ---------------------------------------------------------
    # 4. Calculate dry-day baseline speed
    # ---------------------------------------------------------
    df["time_of_day"] = df["timestamp_dt"].dt.time
    df["date"] = df["timestamp_dt"].dt.date

    rain_dates = {
        pd.to_datetime("2026-09-20").date(),
        pd.to_datetime("2026-09-23").date(),
    }

    dry_df = df[~df["date"].isin(rain_dates)].copy()

    tod_baselines = (
        dry_df
        .groupby(["zone_id", "time_of_day"])["avg_speed_kmph"]
        .median()
        .reset_index()
    )

    tod_baselines.columns = [
        "zone_id",
        "time_of_day",
        "dry_baseline_speed",
    ]

    df = pd.merge(
        df,
        tod_baselines,
        on=["zone_id", "time_of_day"],
        how="left",
    )

    # If a zone/time combination has no dry-day baseline,
    # fall back to its current speed.
    df["dry_baseline_speed"] = (
        df["dry_baseline_speed"]
        .fillna(df["avg_speed_kmph"])
    )

    # Avoid division by zero.
    df["speed_drop_pct"] = np.where(
        df["dry_baseline_speed"] > 0,
        (
            (
                df["dry_baseline_speed"]
                - df["avg_speed_kmph"]
            )
            / df["dry_baseline_speed"]
        ) * 100.0,
        0.0,
    )

    # ---------------------------------------------------------
    # 5. Sort chronologically before rolling calculations
    # ---------------------------------------------------------
    df = (
        df
        .sort_values(["zone_id", "timestamp_dt"])
        .reset_index(drop=True)
    )

    # ---------------------------------------------------------
    # 6. Rolling rainfall features
    #
    # Data is sampled every 30 minutes:
    #   1 hour = 2 observations
    #   3 hours = 6 observations
    # ---------------------------------------------------------
    df["rainfall_sum_1h"] = (
        df
        .groupby("zone_id")["rainfall_mm"]
        .transform(
            lambda x: x.rolling(
                2,
                min_periods=1
            ).sum()
        )
    )

    df["rainfall_sum_3h"] = (
        df
        .groupby("zone_id")["rainfall_mm"]
        .transform(
            lambda x: x.rolling(
                6,
                min_periods=1
            ).sum()
        )
    )

    # ---------------------------------------------------------
    # 7. Map incidents
    # ---------------------------------------------------------
    incidents["is_waterlogging"] = (
        incidents["incident_type"] == "Waterlogging"
    ).astype(int)

    incidents["is_other"] = (
        incidents["incident_type"] != "Waterlogging"
    ).astype(int)

    wl_at_t = (
        incidents[incidents["is_waterlogging"] == 1]
        .groupby(["zone_id", "timestamp_dt"])
        .size()
        .reset_index(name="waterlogging_count_t")
    )

    other_at_t = (
        incidents[incidents["is_other"] == 1]
        .groupby(["zone_id", "timestamp_dt"])
        .size()
        .reset_index(name="other_incidents_count_t")
    )

    df = pd.merge(
        df,
        wl_at_t,
        on=["zone_id", "timestamp_dt"],
        how="left",
    )

    df = pd.merge(
        df,
        other_at_t,
        on=["zone_id", "timestamp_dt"],
        how="left",
    )

    df["waterlogging_count_t"] = (
        df["waterlogging_count_t"]
        .fillna(0)
    )

    df["other_incidents_count_t"] = (
        df["other_incidents_count_t"]
        .fillna(0)
    )

    df["hour_of_day"] = df["timestamp_dt"].dt.hour

    # ---------------------------------------------------------
    # 8. Future target window
    #
    # Current data is sampled every 30 minutes.
    #
    # For forecast time t:
    #
    #   first future point = t + 30m
    #   second future point = t + 60m
    #
    # The target is positive if ANY point in this window has:
    #
    #   speed_drop_pct > 25%
    #       OR
    #   waterlogging_count > 0
    # ---------------------------------------------------------

    # Number of 30-minute steps required for the start of the
    # forecast window.
    horizon_steps = max(
        1,
        int(round(forecast_horizon_minutes / 30))
    )

    # The requested window ends 30 minutes after the forecast
    # horizon. For the default horizon of 30 minutes:
    #
    #   start = t + 30m
    #   end   = t + 60m
    end_steps = horizon_steps + 1

    grouped_speed = df.groupby("zone_id")["speed_drop_pct"]
    grouped_waterlogging = df.groupby("zone_id")[
        "waterlogging_count_t"
    ]

    future_speed_values = []

    for step in range(horizon_steps, end_steps):
        future_speed_values.append(
            grouped_speed.shift(-step)
        )

    future_waterlogging_values = []

    for step in range(horizon_steps, end_steps):
        future_waterlogging_values.append(
            grouped_waterlogging.shift(-step)
        )

    # Combine the future observations into a single future
    # disruption condition.
    future_speed_df = pd.concat(
        future_speed_values,
        axis=1,
    )

    future_waterlogging_df = pd.concat(
        future_waterlogging_values,
        axis=1,
    )

    # Preserve the future values for debugging/evaluation.
    df["future_speed_drop"] = future_speed_df.max(
        axis=1,
        skipna=True,
    )

    df["future_waterlogging"] = future_waterlogging_df.max(
        axis=1,
        skipna=True,
    )

    # ---------------------------------------------------------
    # 9. Make sure the complete future window exists
    # ---------------------------------------------------------
    complete_future_window = (
        future_speed_df.notna().all(axis=1)
        &
        future_waterlogging_df.notna().all(axis=1)
    )

    # ---------------------------------------------------------
    # 10. Disruption label
    #
    # IMPORTANT:
    # The agreed label uses OR:
    #
    #   future speed drop > 25%
    #   OR
    #   future waterlogging > 0
    # ---------------------------------------------------------
    df["target_disruption"] = np.nan

    valid_rows = complete_future_window

    df.loc[valid_rows, "target_disruption"] = (
        (
            df.loc[valid_rows, "future_speed_drop"] > 25.0
        )
        |
        (
            df.loc[valid_rows, "future_waterlogging"] > 0
        )
    ).astype(int)

    # ---------------------------------------------------------
    # 11. Remove rows where the complete future target window
    #     does not exist.
    # ---------------------------------------------------------
    df = df.loc[valid_rows].copy()

    df["target_disruption"] = (
        df["target_disruption"]
        .astype(int)
    )

    # ---------------------------------------------------------
    # 12. Return feature matrix and target
    # ---------------------------------------------------------
    return df, df["target_disruption"]


if __name__ == "__main__":
    print("Testing features.py...")

    df, y = build_feature_matrix("data/raw")

    print(
        f"Feature matrix built successfully: "
        f"Shape {df.shape}, "
        f"Positive Disruption Labels: {y.sum()}"
    )

    print(
        "Target definition: "
        "disruption during t+30 to t+60 minutes."
    )

    print("features.py OK.")