import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# Fixed seed
np.random.seed(42)

# Ensure figures directory exists
os.makedirs("reports/figures", exist_ok=True)
os.makedirs("notebooks", exist_ok=True)

print("--- STARTING CITYPULSE BLOCK 0: EDA ---")

# Load datasets
zones_df = pd.read_csv("data/raw/zones.csv")
weather_df = pd.read_csv("data/raw/weather.csv")
traffic_df = pd.read_csv("data/raw/traffic.csv")
incidents_df = pd.read_csv("data/raw/incidents.csv")

# Parse timestamps
weather_df["timestamp"] = pd.to_datetime(weather_df["timestamp"])
traffic_df["timestamp"] = pd.to_datetime(traffic_df["timestamp"])
incidents_df["timestamp"] = pd.to_datetime(incidents_df["timestamp"])

print(f"Zones shape: {zones_df.shape}")
print(f"Weather shape: {weather_df.shape}, Time bounds: {weather_df['timestamp'].min()} to {weather_df['timestamp'].max()}")
print(f"Traffic shape: {traffic_df.shape}, Time bounds: {traffic_df['timestamp'].min()} to {traffic_df['timestamp'].max()}")
print(f"Incidents shape: {incidents_df.shape}, Time bounds: {incidents_df['timestamp'].min()} to {incidents_df['timestamp'].max()}")

# 1. Missing values check
print("\n--- Missing Values Check ---")
print("Zones missing:", zones_df.isnull().sum().to_dict())
print("Weather missing:", weather_df.isnull().sum().to_dict())
print("Traffic missing:", traffic_df.isnull().sum().to_dict())
print("Incidents missing:", incidents_df.isnull().sum().to_dict())

# 2. Rain Events Analysis
rain_weather = weather_df[weather_df["rainfall_mm"] > 0]
print(f"\nTotal weather records with rainfall > 0: {len(rain_weather)} out of {len(weather_df)} ({len(rain_weather)/len(weather_df):.2%})")

# Group rainfall by timestamp across city
city_rain = weather_df.groupby("timestamp")["rainfall_mm"].mean().reset_index()
city_rain_active = city_rain[city_rain["rainfall_mm"] > 0]
print("\nActive Rain Timestamps (City Mean > 0):")
print(city_rain_active)

# 3. Incident Analysis
print("\n--- Incident Types & Counts ---")
print(incidents_df["incident_type"].value_counts())
print("\nIncident Severities:")
print(incidents_df["severity"].value_counts())
print("\nIncident Statuses:")
print(incidents_df["status"].value_counts())

# Waterlogging timing check
waterlogging_df = incidents_df[incidents_df["incident_type"] == "Waterlogging"]
print(f"\nTotal Waterlogging incidents: {len(waterlogging_df)}")

# 4. Congestion Level vs. Speed Analysis (Label Leakage Check)
print("\n--- Speed vs. Congestion Level Distribution ---")
speed_by_cong = traffic_df.groupby("congestion_level")["avg_speed_kmph"].describe()
print(speed_by_cong)

# Check exact thresholds for congestion_level
print("\nCongestion Level ranges:")
for level in ["LOW", "MEDIUM", "HIGH"]:
    sub = traffic_df[traffic_df["congestion_level"] == level]["avg_speed_kmph"]
    print(f"{level}: Min={sub.min()}, Max={sub.max()}, Mean={sub.mean():.2f}, Std={sub.std():.2f}")

# 5. Per-Zone Sensitivity & Variation Analysis
print("\n--- Per-Zone Baseline & Rain Response ---")
# Merge traffic with weather nearest or exact timestamp (since traffic is 30-min, weather is hourly)
traffic_df["hourly_timestamp"] = traffic_df["timestamp"].dt.floor("h")
merged_df = pd.merge(traffic_df, weather_df[["timestamp", "zone_id", "rainfall_mm", "weather_condition"]], 
                     left_on=["hourly_timestamp", "zone_id"], right_on=["timestamp", "zone_id"], 
                     suffixes=('', '_weather'))

zone_summary = merged_df.groupby("zone_id").agg(
    avg_speed_normal=('avg_speed_kmph', lambda x: x[merged_df.loc[x.index, 'rainfall_mm'] == 0].mean()),
    avg_speed_rain=('avg_speed_kmph', lambda x: x[merged_df.loc[x.index, 'rainfall_mm'] > 0].mean()),
    max_vehicle_count=('vehicle_count', 'max'),
).reset_index()

zone_summary["speed_drop_pct"] = (zone_summary["avg_speed_normal"] - zone_summary["avg_speed_rain"]) / zone_summary["avg_speed_normal"] * 100
zone_summary = pd.merge(zone_summary, zones_df[["zone_id", "zone_name"]], on="zone_id")

# Count waterlogging incidents per zone
wl_per_zone = waterlogging_df.groupby("zone_id").size().reset_index(name="waterlogging_incidents")
zone_summary = pd.merge(zone_summary, wl_per_zone, on="zone_id", how="left").fillna(0)

print(zone_summary[["zone_id", "zone_name", "avg_speed_normal", "avg_speed_rain", "speed_drop_pct", "waterlogging_incidents"]])

# 6. Generate Summary Plots
# Plot 1: Citywide Rainfall & Waterlogging Incidents over time
fig, ax1 = plt.subplots(figsize=(12, 5))

city_rain_series = weather_df.groupby("timestamp")["rainfall_mm"].mean()
ax1.plot(city_rain_series.index, city_rain_series.values, color="tab:blue", label="City Avg Rainfall (mm)")
ax1.set_ylabel("Rainfall (mm)", color="tab:blue")
ax1.set_xlabel("Date")

ax2 = ax1.twinx()
wl_counts = waterlogging_df.set_index("timestamp").resample("1h").size()
ax2.bar(wl_counts.index, wl_counts.values, width=0.03, color="tab:red", alpha=0.6, label="Waterlogging Incidents")
ax2.set_ylabel("Waterlogging Count / Hour", color="tab:red")

plt.title("CityPulse Block 0 EDA: Rainfall vs. Waterlogging Incidents")
plt.grid(True, linestyle="--", alpha=0.5)
fig.tight_layout()
plt.savefig("reports/figures/rainfall_vs_waterlogging.png", dpi=150)
plt.close()

# Plot 2: Traffic Speed Boxplot by Congestion Level
plt.figure(figsize=(8, 5))
traffic_df.boxplot(column="avg_speed_kmph", by="congestion_level", grid=True)
plt.title("Traffic Speed (km/h) by Congestion Level")
plt.suptitle("")
plt.xlabel("Congestion Level")
plt.ylabel("Average Speed (km/h)")
plt.tight_layout()
plt.savefig("reports/figures/congestion_vs_speed.png", dpi=150)
plt.close()

# Plot 3: Speed drop during rain by zone
plt.figure(figsize=(10, 5))
x = np.arange(len(zone_summary))
width = 0.35
plt.bar(x - width/2, zone_summary["avg_speed_normal"], width, label="Normal Avg Speed (km/h)", color="#2b5c8f")
plt.bar(x + width/2, zone_summary["avg_speed_rain"], width, label="Rain Avg Speed (km/h)", color="#d95f02")
plt.xticks(x, zone_summary["zone_name"], rotation=45, ha="right")
plt.ylabel("Speed (km/h)")
plt.title("Per-Zone Speed Comparison: Normal vs. Rain Periods")
plt.legend()
plt.tight_layout()
plt.savefig("reports/figures/per_zone_speed_drop.png", dpi=150)
plt.close()

print("\nEDA script completed successfully. Plots saved to reports/figures/")
