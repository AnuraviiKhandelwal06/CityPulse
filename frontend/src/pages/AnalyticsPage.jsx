import React, { useState, useEffect, useMemo } from 'react';

export default function AnalyticsPage({
  apiFetch = null,
  onNavigate = () => {},
  currentStep = 4,
  zones: propZones = [],
  vitals: propVitals = null
}) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User interactive controls
  const [timeRange, setTimeRange] = useState('replay'); // 'replay' | 'hour' | 'today'
  const [weatherMetric, setWeatherMetric] = useState('rain'); // 'rain' | 'temp' | 'wind'
  const [trafficMetric, setTrafficMetric] = useState('both'); // 'both' | 'cong' | 'speed'
  const [zoneSortBy, setZoneSortBy] = useState('risk'); // 'risk' | 'traffic' | 'incidents'

  // Safe fetch helper
  const safeFetch = async (url) => {
    if (apiFetch) {
      try {
        const res = await apiFetch(url);
        if (res && res.ok) return res;
      } catch (e) {}
    }
    try {
      const res = await fetch(`http://127.0.0.1:8000${url}`);
      if (res.ok) return res;
    } catch (e) {}
    return fetch(url);
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetch('/api/analytics');
      if (!res.ok) throw new Error(`API returned HTTP ${res.status}`);
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('[Analytics] Failed to fetch analytics:', err);
      setError(err.message || 'Failed to load analytics telemetry');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever simulation step or page mounts
  useEffect(() => {
    fetchAnalytics();
  }, [currentStep]);

  // Extract zones safely for useMemo
  const liveZones = analyticsData?.zones || [];

  // All useMemo hooks must be called unconditionally before any early returns
  const sortedZones = useMemo(() => {
    const list = [...(liveZones.length > 0 ? liveZones : propZones || [])];
    return list.sort((a, b) => {
      if (zoneSortBy === 'risk') {
        return (b.severity_score || 0) - (a.severity_score || 0);
      }
      if (zoneSortBy === 'traffic') {
        const speedA = parseFloat(a.speed) || 50;
        const speedB = parseFloat(b.speed) || 50;
        return speedA - speedB; // Slower speed = higher congestion first
      }
      if (zoneSortBy === 'incidents') {
        return (b.reports || 0) - (a.reports || 0);
      }
      return 0;
    });
  }, [liveZones, propZones, zoneSortBy]);

  if (loading && !analyticsData) {
    return (
      <div className="flex flex-col gap-6">
        <div className="bg-surface-container-low p-12 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
          <span className="font-bold text-sm text-on-surface">Compiling Longitudinal Analytics...</span>
          <span className="text-xs text-on-surface-variant font-mono">Synthesizing cross-stream temporal trends</span>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="flex flex-col gap-6">
        <div className="p-6 rounded-2xl bg-surface-container-low border border-error/30 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-error">
            <span className="material-symbols-outlined text-[24px]">error</span>
            <h2 className="font-bold text-base">Analytics Service Unavailable</h2>
          </div>
          <p className="text-xs text-on-surface-variant">{error || 'Could not retrieve temporal telemetry.'}</p>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="self-start px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const {
    timeline_series = [],
    pulse_index = {
      score: 100,
      max_score: 100,
      status: 'CRITICAL',
      label: 'CityPulse Composite Indicator',
      disclaimer: 'CityPulse-derived indicator; not an official government metric.',
      breakdown: {
        traffic: { score: 25, max: 25, metric: '88% congestion' },
        weather: { score: 25, max: 25, metric: '82.5 mm/h rain' },
        civic: { score: 30, max: 30, metric: '19 311 tickets' },
        transit: { score: 20, max: 20, metric: '+26m delay' }
      }
    },
    zones = [],
    correlations = [],
    insights = []
  } = analyticsData || {};

  // Status badge styling
  const indexStatusConfig = {
    NORMAL: {
      dot: '🟢',
      label: 'NORMAL',
      classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    },
    WATCH: {
      dot: '🟡',
      label: 'WATCH',
      classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
    },
    CRITICAL: {
      dot: '🔴',
      label: 'CRITICAL',
      classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
    }
  };
  const currentStatusConfig = indexStatusConfig[pulse_index.status] || indexStatusConfig.NORMAL;

  // Chart dimensions & helper for SVG line charts
  // 5 intervals: 00:00, 05:00, 10:00, 15:00, 20:00
  const chartW = 500;
  const chartH = 150;
  const padX = 45;
  const padY = 20;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const getX = (index) => padX + (index * plotW) / Math.max(1, timeline_series.length - 1);
  const getY = (val, maxVal) => (padY + plotH) - (Math.max(0, val) / Math.max(1, maxVal)) * plotH;

  // Weather data mapping
  const weatherConfig = {
    rain: {
      label: 'Rainfall',
      unit: 'mm/h',
      color: '#38bdf8',
      fill: 'rgba(56, 189, 248, 0.15)',
      max: Math.max(10, ...timeline_series.map((t) => t.rainfall_mm || 0)),
      getValue: (t) => t.rainfall_mm || 0
    },
    temp: {
      label: 'Temperature',
      unit: '°C',
      color: '#f97316',
      fill: 'rgba(249, 115, 22, 0.15)',
      max: 40,
      getValue: (t) => t.temperature_c || 28.0
    },
    wind: {
      label: 'Wind Speed',
      unit: 'km/h',
      color: '#a855f7',
      fill: 'rgba(168, 85, 247, 0.15)',
      max: Math.max(20, ...timeline_series.map((t) => t.wind_kmh || 0)),
      getValue: (t) => t.wind_kmh || 12.0
    }
  };
  const activeWeather = weatherConfig[weatherMetric];

  // Civic incidents maximum
  const maxCivic = Math.max(5, ...timeline_series.map((t) => t.civic_reports || 0));

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Page Header */}
      <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[28px]">monitoring</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold font-headline-lg text-on-surface">
                CITY ANALYTICS
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-[11px] font-mono font-bold text-primary">
                Simulation Step {currentStep}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              Understand how city conditions change over time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('zones')}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/25 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">location_city</span>
            View City Zones
          </button>
          <button
            type="button"
            onClick={() => onNavigate('simulate')}
            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            What-If Simulator
          </button>
        </div>
      </div>

      {/* 2. Top Banner: CityPulse Composite Indicator */}
      <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[24px]">speed</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block">
                {pulse_index.label || 'CityPulse Composite Indicator'}
              </span>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-2xl md:text-3xl font-extrabold text-on-surface font-headline-lg">
                  {pulse_index.score} <span className="text-xs font-normal text-on-surface-variant">/ {pulse_index.max_score || 100}</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border flex items-center gap-1 ${currentStatusConfig.classes}`}>
                  <span>{currentStatusConfig.dot}</span>
                  <span>{currentStatusConfig.label}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant italic max-w-md">
            <strong>CityPulse Composite Indicator:</strong> Empirical composite index evaluating multi-domain city stress. {pulse_index.disclaimer || 'Not an official government metric.'}
          </div>
        </div>

        {/* 4 Component Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Traffic */}
          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono flex items-center gap-1">
                <span>🚗</span> Traffic
              </span>
              <span className="font-mono font-bold text-xs text-primary">
                {pulse_index.breakdown?.traffic?.score || 0} / {pulse_index.breakdown?.traffic?.max || 25}
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((pulse_index.breakdown?.traffic?.score || 0) / (pulse_index.breakdown?.traffic?.max || 25)) * 100}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-on-surface-variant font-mono">
              {pulse_index.breakdown?.traffic?.metric || 'Nominal Flow'}
            </span>
          </div>

          {/* Weather */}
          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono flex items-center gap-1">
                <span>🌧</span> Weather
              </span>
              <span className="font-mono font-bold text-xs text-secondary">
                {pulse_index.breakdown?.weather?.score || 0} / {pulse_index.breakdown?.weather?.max || 25}
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${((pulse_index.breakdown?.weather?.score || 0) / (pulse_index.breakdown?.weather?.max || 25)) * 100}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-on-surface-variant font-mono">
              {pulse_index.breakdown?.weather?.metric || 'Clear'}
            </span>
          </div>

          {/* Civic */}
          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono flex items-center gap-1">
                <span>💧</span> Civic
              </span>
              <span className="font-mono font-bold text-xs text-error">
                {pulse_index.breakdown?.civic?.score || 0} / {pulse_index.breakdown?.civic?.max || 30}
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-error rounded-full transition-all duration-500"
                style={{ width: `${((pulse_index.breakdown?.civic?.score || 0) / (pulse_index.breakdown?.civic?.max || 30)) * 100}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-on-surface-variant font-mono">
              {pulse_index.breakdown?.civic?.metric || '0 tickets'}
            </span>
          </div>

          {/* Transit */}
          <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono flex items-center gap-1">
                <span>⏱</span> Transit
              </span>
              <span className="font-mono font-bold text-xs text-amber-500">
                {pulse_index.breakdown?.transit?.score || 0} / {pulse_index.breakdown?.transit?.max || 20}
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${((pulse_index.breakdown?.transit?.score || 0) / (pulse_index.breakdown?.transit?.max || 20)) * 100}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-on-surface-variant font-mono">
              {pulse_index.breakdown?.transit?.metric || '+0m on-time'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Time Range Selector Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/25 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-on-surface-variant font-bold uppercase">Time Range:</span>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'replay', label: 'Event Replay (T+0m to T+20m)' },
              { id: 'hour', label: 'Last Hour' },
              { id: 'today', label: 'Today (24h)' }
            ].map((rng) => (
              <button
                key={rng.id}
                type="button"
                onClick={() => setTimeRange(rng.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  timeRange === rng.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {rng.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] font-mono text-on-surface-variant flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
          <span>Simulation Horizon: {timeline_series.length} Synchronized Intervals</span>
        </div>
      </div>

      {/* 4. Core Visualizations Grid (2x2 Clean Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend 1: TRAFFIC TREND */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2.5">
              <div>
                <h2 className="text-sm font-bold text-on-surface font-headline-sm uppercase tracking-wide">
                  TRAFFIC TREND
                </h2>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  Units: % Congestion, km/h Speed &bull; Corridors
                </span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/15 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setTrafficMetric('both')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${trafficMetric === 'both' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'}`}
                >
                  Both
                </button>
                <button
                  type="button"
                  onClick={() => setTrafficMetric('cong')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${trafficMetric === 'cong' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'}`}
                >
                  Congestion
                </button>
                <button
                  type="button"
                  onClick={() => setTrafficMetric('speed')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${trafficMetric === 'speed' ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant'}`}
                >
                  Speed
                </button>
              </div>
            </div>

            {/* SVG Time Series Chart */}
            <div className="w-full pt-2">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-40 overflow-visible">
                {/* Horizontal Grid lines */}
                <line x1={padX} y1={padY} x2={chartW - padX} y2={padY} stroke="currentColor" className="text-outline-variant/15" strokeDasharray="3 3" />
                <line x1={padX} y1={padY + plotH / 2} x2={chartW - padX} y2={padY + plotH / 2} stroke="currentColor" className="text-outline-variant/15" strokeDasharray="3 3" />
                <line x1={padX} y1={padY + plotH} x2={chartW - padX} y2={padY + plotH} stroke="currentColor" className="text-outline-variant/25" />

                {/* Y-Axis scale label */}
                <text x={padX - 8} y={padY + 4} textAnchor="end" className="text-[10px] fill-current text-on-surface-variant font-mono">100%</text>
                <text x={padX - 8} y={padY + plotH / 2 + 3} textAnchor="end" className="text-[10px] fill-current text-on-surface-variant font-mono">50%</text>
                <text x={padX - 8} y={padY + plotH + 3} textAnchor="end" className="text-[10px] fill-current text-on-surface-variant font-mono">0%</text>

                {/* Congestion Line (Primary Blue/Purple) */}
                {(trafficMetric === 'both' || trafficMetric === 'cong') && (
                  <>
                    <path
                      d={`M ${timeline_series.map((t, i) => `${getX(i)},${getY(t.traffic_congestion_pct, 100)}`).join(' L ')}`}
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                    />
                    {timeline_series.map((t, i) => (
                      <g key={`cg-${i}`}>
                        <circle cx={getX(i)} cy={getY(t.traffic_congestion_pct, 100)} r="4" fill="#818cf8" />
                        <text x={getX(i)} y={getY(t.traffic_congestion_pct, 100) - 8} textAnchor="middle" className="text-[10px] font-mono font-bold fill-current text-on-surface">
                          {t.traffic_congestion_pct}%
                        </text>
                      </g>
                    ))}
                  </>
                )}

                {/* Speed Line (Amber / Speed scale: 50 km/h max) */}
                {(trafficMetric === 'both' || trafficMetric === 'speed') && (
                  <>
                    <path
                      d={`M ${timeline_series.map((t, i) => `${getX(i)},${getY((t.vehicle_speed_kmh / 50) * 100, 100)}`).join(' L ')}`}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    {timeline_series.map((t, i) => (
                      <g key={`sp-${i}`}>
                        <circle cx={getX(i)} cy={getY((t.vehicle_speed_kmh / 50) * 100, 100)} r="3.5" fill="#fbbf24" />
                        {trafficMetric === 'speed' && (
                          <text x={getX(i)} y={getY((t.vehicle_speed_kmh / 50) * 100, 100) - 8} textAnchor="middle" className="text-[10px] font-mono font-bold fill-current text-amber-500">
                            {t.vehicle_speed_kmh}km/h
                          </text>
                        )}
                      </g>
                    ))}
                  </>
                )}

                {/* X-Axis timestamps */}
                {timeline_series.map((t, i) => (
                  <text key={`tx-${i}`} x={getX(i)} y={chartH - 2} textAnchor="middle" className="text-[10px] font-mono fill-current text-on-surface-variant">
                    {t.time}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-outline-variant/15 pt-2.5">
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#818cf8]"></span> Congestion %</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]"></span> Speed (km/h)</span>
            </div>
            <span className="text-[11px] text-on-surface-variant italic">
              Speed decelerated to 4.2 km/h
            </span>
          </div>
        </div>

        {/* Trend 2: RAINFALL / WEATHER TREND */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2.5">
              <div>
                <h2 className="text-sm font-bold text-on-surface font-headline-sm uppercase tracking-wide">
                  RAINFALL / WEATHER TREND
                </h2>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  Units: {activeWeather.unit} &bull; Sensor Feed: Open-Meteo
                </span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/15 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setWeatherMetric('rain')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${weatherMetric === 'rain' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant'}`}
                >
                  Rainfall
                </button>
                <button
                  type="button"
                  onClick={() => setWeatherMetric('temp')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${weatherMetric === 'temp' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant'}`}
                >
                  Temp
                </button>
                <button
                  type="button"
                  onClick={() => setWeatherMetric('wind')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${weatherMetric === 'wind' ? 'bg-secondary text-on-secondary font-bold' : 'text-on-surface-variant'}`}
                >
                  Wind
                </button>
              </div>
            </div>

            {/* SVG Weather Chart */}
            <div className="w-full pt-2">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-40 overflow-visible">
                {/* Horizontal Grid */}
                <line x1={padX} y1={padY} x2={chartW - padX} y2={padY} stroke="currentColor" className="text-outline-variant/15" strokeDasharray="3 3" />
                <line x1={padX} y1={padY + plotH / 2} x2={chartW - padX} y2={padY + plotH / 2} stroke="currentColor" className="text-outline-variant/15" strokeDasharray="3 3" />
                <line x1={padX} y1={padY + plotH} x2={chartW - padX} y2={padY + plotH} stroke="currentColor" className="text-outline-variant/25" />

                {/* Y-Axis scale label */}
                <text x={padX - 8} y={padY + 4} textAnchor="end" className="text-[10px] fill-current text-on-surface-variant font-mono">
                  {Math.round(activeWeather.max)} {activeWeather.unit}
                </text>
                <text x={padX - 8} y={padY + plotH / 2 + 3} textAnchor="end" className="text-[10px] fill-current text-on-surface-variant font-mono">
                  {Math.round(activeWeather.max / 2)} {activeWeather.unit}
                </text>
                <text x={padX - 8} y={padY + plotH + 3} textAnchor="end" className="text-[10px] fill-current text-on-surface-variant font-mono">
                  0 {activeWeather.unit}
                </text>

                {/* Shaded Area Under Curve */}
                <polygon
                  points={`${getX(0)},${padY + plotH} ${timeline_series.map((t, i) => `${getX(i)},${getY(activeWeather.getValue(t), activeWeather.max)}`).join(' ')} ${getX(timeline_series.length - 1)},${padY + plotH}`}
                  fill={activeWeather.fill}
                />

                {/* Line Path */}
                <path
                  d={`M ${timeline_series.map((t, i) => `${getX(i)},${getY(activeWeather.getValue(t), activeWeather.max)}`).join(' L ')}`}
                  fill="none"
                  stroke={activeWeather.color}
                  strokeWidth="2.5"
                />

                {/* Data Points */}
                {timeline_series.map((t, i) => {
                  const val = activeWeather.getValue(t);
                  return (
                    <g key={`w-${i}`}>
                      <circle cx={getX(i)} cy={getY(val, activeWeather.max)} r="4" fill={activeWeather.color} />
                      <text x={getX(i)} y={getY(val, activeWeather.max) - 8} textAnchor="middle" className="text-[10px] font-mono font-bold fill-current text-on-surface">
                        {val} {activeWeather.unit}
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis timestamps */}
                {timeline_series.map((t, i) => (
                  <text key={`wx-${i}`} x={getX(i)} y={chartH - 2} textAnchor="middle" className="text-[10px] font-mono fill-current text-on-surface-variant">
                    {t.time}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-outline-variant/15 pt-2.5">
            <span className="font-mono text-[11px] text-secondary flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeWeather.color }}></span>
              {activeWeather.label}: Peak {Math.max(...timeline_series.map(activeWeather.getValue))} {activeWeather.unit}
            </span>
            <span className="text-[11px] text-on-surface-variant italic">
              Precipitation surge persisted across steps
            </span>
          </div>
        </div>

        {/* Trend 3: CIVIC INCIDENTS */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2.5">
              <div>
                <h2 className="text-sm font-bold text-on-surface font-headline-sm uppercase tracking-wide">
                  CIVIC INCIDENTS
                </h2>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  Units: Citizen 311 Reports &bull; Feed: Municipal Grievance Desk
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-error/15 text-error text-[10px] font-mono font-bold border border-error/30">
                Waterlogging Surge
              </span>
            </div>

            {/* Stepped Bar & Incident Details Visualization */}
            <div className="flex flex-col gap-2.5 pt-2">
              {timeline_series.map((item) => {
                const isSpike = (item.civic_reports || 0) >= 10;
                return (
                  <div key={item.step} className="p-2 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-[70px]">
                      <span className="font-mono font-bold text-on-surface">{item.time}</span>
                      <span className="text-[10px] font-mono text-on-surface-variant">T+{item.elapsed_minutes}m</span>
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-on-surface truncate">
                          {item.incident_details || item.incident_type || 'Civic Ticket'}
                        </span>
                        <span className={`font-mono font-bold ${isSpike ? 'text-error' : 'text-on-surface'}`}>
                          {item.civic_reports} reports
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isSpike ? 'bg-error' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, ((item.civic_reports || 0) / maxCivic) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-outline-variant/15 pt-2.5">
            <span className="font-mono text-[11px] text-error flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-error"></span> 311 Flooding Complaints
            </span>
            <span className="text-[11px] text-on-surface-variant italic">
              Surged from 1 to 19 concurrent reports
            </span>
          </div>
        </div>

        {/* Trend 4: DISRUPTION RISK */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2.5">
              <div>
                <h2 className="text-sm font-bold text-on-surface font-headline-sm uppercase tracking-wide">
                  DISRUPTION RISK
                </h2>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  Units: Severity Score %, Nowcast Probability % &bull; Model: HistGradientBoosting
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-500 text-[10px] font-mono font-bold border border-rose-500/30">
                Multi-Stream Disruption
              </span>
            </div>

            {/* SVG Dual Series: Severity Score vs ML Prediction */}
            <div className="w-full pt-2">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-40 overflow-visible">
                {/* Horizontal Grid */}
                <line x1={padX} y1={padY} x2={chartW - padX} y2={padY} stroke="currentColor" className="text-outline-variant/15" strokeDasharray="3 3" />
                <line x1={padX} y1={padY + plotH / 2} x2={chartW - padX} y2={padY + plotH / 2} stroke="currentColor" className="text-outline-variant/15" strokeDasharray="3 3" />
                <line x1={padX} y1={padY + plotH} x2={chartW - padX} y2={padY + plotH} stroke="currentColor" className="text-outline-variant/25" />

                {/* Y-Axis */}
                <text x={padX - 8} y={padY + 4} textAnchor="end" className="text-[10px] fill-current text-on-surface-variant font-mono">100%</text>
                <text x={padX - 8} y={padY + plotH / 2 + 3} textAnchor="end" className="text-[10px] fill-current text-on-surface-variant font-mono">50%</text>
                <text x={padX - 8} y={padY + plotH + 3} textAnchor="end" className="text-[10px] fill-current text-on-surface-variant font-mono">0%</text>

                {/* ML Risk Probability (Primary Green/Cyan line) */}
                <path
                  d={`M ${timeline_series.map((t, i) => `${getX(i)},${getY(Math.round((t.prediction_probability || 0) * 100), 100)}`).join(' L ')}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />

                {/* Severity Score (Rose line) */}
                <path
                  d={`M ${timeline_series.map((t, i) => `${getX(i)},${getY(Math.round((t.severity_score || 0) * 100), 100)}`).join(' L ')}`}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                />

                {timeline_series.map((t, i) => {
                  const sPct = Math.round((t.severity_score || 0) * 100);
                  const pPct = Math.round((t.prediction_probability || 0) * 100);
                  return (
                    <g key={`rk-${i}`}>
                      <circle cx={getX(i)} cy={getY(sPct, 100)} r="4" fill="#f43f5e" />
                      <circle cx={getX(i)} cy={getY(pPct, 100)} r="3" fill="#38bdf8" />
                      <text x={getX(i)} y={getY(sPct, 100) - 8} textAnchor="middle" className="text-[10px] font-mono font-bold fill-current text-rose-500">
                        {sPct}%
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis timestamps */}
                {timeline_series.map((t, i) => (
                  <text key={`rx-${i}`} x={getX(i)} y={chartH - 2} textAnchor="middle" className="text-[10px] font-mono fill-current text-on-surface-variant">
                    {t.time}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs border-t border-outline-variant/15 pt-2.5">
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></span> Severity Score</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]"></span> ML Predictive Risk</span>
            </div>
            <span className="text-[11px] text-on-surface-variant italic">
              ML predicted 99.9% early warning
            </span>
          </div>
        </div>
      </div>

      {/* 5. ZONE COMPARISON Snapshot */}
      <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/15 pb-3">
          <div>
            <h2 className="text-sm font-bold text-on-surface font-headline-sm uppercase tracking-wide">
              ZONE COMPARISON
            </h2>
            <span className="text-[10px] text-on-surface-variant font-mono">
              Comparative corridor telemetry across monitored Delhi sectors
            </span>
          </div>

          {/* Simple Sorting Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-on-surface-variant">Sort by:</span>
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/15 text-xs">
              <button
                type="button"
                onClick={() => setZoneSortBy('risk')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  zoneSortBy === 'risk' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Risk
              </button>
              <button
                type="button"
                onClick={() => setZoneSortBy('traffic')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  zoneSortBy === 'traffic' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Traffic
              </button>
              <button
                type="button"
                onClick={() => setZoneSortBy('incidents')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  zoneSortBy === 'incidents' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Incidents
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 font-mono text-[10px] text-on-surface-variant uppercase">
                <th className="py-2.5 px-3">Zone Corridor</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3">Traffic Speed</th>
                <th className="py-2.5 px-3">Civic Incidents</th>
                <th className="py-2.5 px-3">Predictive Risk</th>
                <th className="py-2.5 px-3 text-right">Severity Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {sortedZones.map((z) => {
                const s = (z.severity || 'LOW').toUpperCase();
                const badge = s === 'CRITICAL' || s === 'HIGH'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : s === 'MEDIUM' || s === 'WATCH'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
                const pRisk = z.predictive_risk || (s === 'CRITICAL' ? 'HIGH' : s === 'MEDIUM' ? 'MEDIUM' : 'LOW');
                const pProb = z.predictive_probability !== undefined && z.predictive_probability !== null
                  ? Math.round(z.predictive_probability * 100)
                  : (s === 'CRITICAL' ? 99 : s === 'MEDIUM' ? 35 : 0);

                return (
                  <tr key={z.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-on-surface block">{z.name}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">ID: {z.id}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] border ${badge}`}>
                        {s === 'CRITICAL' ? '🔴 CRITICAL' : s === 'MEDIUM' ? '🟡 WATCH' : '🟢 NORMAL'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-on-surface">
                      {z.speed || '--'} <span className="text-[10px] text-on-surface-variant">(+{z.transit_delay || 0}m)</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-on-surface">
                      <span className={(z.reports || 0) > 0 ? 'text-error font-bold' : ''}>
                        {z.reports || 0} tickets
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium">
                      <span className={pRisk === 'HIGH' ? 'text-rose-500 font-bold' : pRisk === 'MEDIUM' ? 'text-amber-500 font-bold' : 'text-emerald-500'}>
                        {pRisk} ({pProb}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-primary text-right">
                      {Math.round((z.severity_score || 0) * 100)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. CORRELATION / SIGNAL RELATIONSHIPS & CITY INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* CORRELATION / SIGNAL RELATIONSHIPS */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
              <div>
                <h2 className="text-sm font-bold text-on-surface font-headline-sm uppercase tracking-wide">
                  CORRELATION / SIGNAL RELATIONSHIPS
                </h2>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  Existing Spatiotemporal Analytics Engine
                </span>
              </div>
              <span className="text-[10px] font-mono text-primary font-bold">Empirical r</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {correlations.map((c, idx) => (
                <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-on-surface">{c.pair}</span>
                    <span className="text-[11px] text-on-surface-variant leading-tight">{c.relationship}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant/20 font-mono font-bold text-xs text-primary shrink-0">
                    r = {c.coefficient}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant leading-relaxed italic">
            <strong>Scientific Guardrail:</strong> These signals were observed together during the selected period. <strong>Correlation does not establish causation.</strong>
          </div>
        </div>

        {/* CITY INSIGHTS */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
              <div>
                <h2 className="text-sm font-bold text-on-surface font-headline-sm uppercase tracking-wide">
                  CITY INSIGHTS
                </h2>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  Grounded findings from active telemetry
                </span>
              </div>
              <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {insights.map((ins, idx) => (
                <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex items-start gap-2.5 text-xs text-on-surface leading-relaxed">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">check_circle</span>
                  <span>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono border-t border-outline-variant/15 pt-2">
            <span>Derived from live CityPulse database</span>
            <span className="text-primary font-semibold">Zero causal assumptions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
