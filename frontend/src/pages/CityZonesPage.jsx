import React, { useState, useEffect, useMemo } from 'react';
import Map from '../components/Map';

export default function CityZonesPage({
  zones = [],
  currentStep = 4,
  currentAlert = null,
  vitals = null,
  apiFetch = null,
  onNavigate = () => {},
  onOpenWhy = () => {}
}) {
  const [liveZones, setLiveZones] = useState(zones || []);
  const [selectedZoneId, setSelectedZoneId] = useState(zones?.[0]?.id || 'malviya-nagar');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'WATCH' | 'NORMAL'
  const [sortBy, setSortBy] = useState('RISK'); // 'RISK' | 'INCIDENTS' | 'TRAFFIC' | 'NAME'
  const [zonePrediction, setZonePrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

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

  // Fetch latest zones from API to ensure synchronization with simulation
  useEffect(() => {
    let isMounted = true;
    const fetchZones = async () => {
      try {
        const res = await safeFetch('/api/zones');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setLiveZones(data);
            if (!selectedZoneId && data.length > 0) {
              setSelectedZoneId(data[0].id);
            }
          }
        }
      } catch (err) {
        console.error('[CityZones] Failed to fetch zones:', err);
      }
    };
    fetchZones();
    return () => { isMounted = false; };
  }, [currentStep]);

  // Sync with prop updates if available
  useEffect(() => {
    if (zones && zones.length > 0) {
      setLiveZones(zones);
    }
  }, [zones]);

  const activeZone = liveZones.find((z) => z.id === selectedZoneId) || liveZones[0] || {
    id: 'malviya-nagar',
    name: 'Malviya Nagar Hotspot',
    severity: 'CRITICAL',
    severity_score: 0.94,
    confidence: 0.95,
    speed: '4.2 km/h',
    rain: '82.5 mm/h',
    reports: 19,
    transit_delay: 26,
    summary: 'Severe Congestion 88% • Heavy Rain 82mm/h • 19 Flooding Reports'
  };

  // Fetch prediction for the selected zone
  useEffect(() => {
    let isMounted = true;
    const fetchZonePred = async () => {
      if (!activeZone) return;
      setLoadingPrediction(true);
      try {
        const query = `/api/prediction?zone=${encodeURIComponent(activeZone.name)}&step=${currentStep}`;
        const res = await safeFetch(query);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setZonePrediction(data);
        }
      } catch (e) {
        console.error('[CityZones] Failed to fetch zone prediction:', e);
      } finally {
        if (isMounted) setLoadingPrediction(false);
      }
    };
    fetchZonePred();
    return () => { isMounted = false; };
  }, [selectedZoneId, currentStep, activeZone?.name]);

  const [rawEvents, setRawEvents] = useState([]);

  // Fetch events for active corridor if available
  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const res = await safeFetch('/api/events?limit=25');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setRawEvents(data);
        }
      } catch (err) {
        console.error('[CityZones] Failed to fetch events:', err);
      }
    };
    fetchEvents();
    return () => { isMounted = false; };
  }, [currentStep, selectedZoneId]);

  const getStatusBadge = (severity) => {
    const s = (severity || 'LOW').toUpperCase();
    if (s === 'CRITICAL' || s === 'HIGH') {
      return {
        label: 'CRITICAL',
        dot: '🔴',
        classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      };
    }
    if (s === 'MEDIUM' || s === 'WATCH') {
      return {
        label: 'WATCH',
        dot: '🟡',
        classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      };
    }
    return {
      label: 'NORMAL',
      dot: '🟢',
      classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    };
  };

  // Dynamic City-Wide Summary Counts
  const criticalCount = liveZones.filter((z) => (z.severity || '').toUpperCase() === 'CRITICAL' || (z.severity || '').toUpperCase() === 'HIGH').length;
  const watchCount = liveZones.filter((z) => (z.severity || '').toUpperCase() === 'MEDIUM' || (z.severity || '').toUpperCase() === 'WATCH').length;
  const normalCount = liveZones.filter((z) => (z.severity || '').toUpperCase() === 'LOW' || (z.severity || '').toUpperCase() === 'NORMAL').length;
  const activeIncidentsCount = liveZones.filter((z) => z.reports > 0 || (z.severity || '').toUpperCase() === 'CRITICAL').length;

  // Filtered & Sorted Zones List
  const filteredZones = useMemo(() => {
    let result = [...liveZones];

    // Filter
    if (filterStatus === 'CRITICAL') {
      result = result.filter((z) => (z.severity || '').toUpperCase() === 'CRITICAL' || (z.severity || '').toUpperCase() === 'HIGH');
    } else if (filterStatus === 'WATCH') {
      result = result.filter((z) => (z.severity || '').toUpperCase() === 'MEDIUM' || (z.severity || '').toUpperCase() === 'WATCH');
    } else if (filterStatus === 'NORMAL') {
      result = result.filter((z) => (z.severity || '').toUpperCase() === 'LOW' || (z.severity || '').toUpperCase() === 'NORMAL');
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'RISK') {
        return (b.severity_score || 0) - (a.severity_score || 0);
      }
      if (sortBy === 'INCIDENTS') {
        return (b.reports || 0) - (a.reports || 0);
      }
      if (sortBy === 'TRAFFIC') {
        const speedA = parseFloat(a.speed) || 50;
        const speedB = parseFloat(b.speed) || 50;
        return speedA - speedB; // Slower speed = higher congestion first
      }
      if (sortBy === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [liveZones, filterStatus, sortBy]);

  const probPercent = zonePrediction?.risk_probability !== null && zonePrediction?.risk_probability !== undefined
    ? Math.round(zonePrediction.risk_probability * 100)
    : (activeZone.severity === 'CRITICAL' ? 99 : activeZone.severity === 'MEDIUM' ? 35 : 0);

  const zoneRiskLevel = zonePrediction?.risk_level || (activeZone.severity === 'CRITICAL' ? 'HIGH' : activeZone.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW');

  const hasActiveIncident = activeZone.reports > 0 || activeZone.severity === 'CRITICAL' || (activeZone.severity_score || 0) >= 0.6;
  const incidentName = hasActiveIncident
    ? `${activeZone.name.replace(' Hotspot', '').replace(' Hub', '').replace(' Corridor', '')} Underpass Waterlogging`
    : 'None';

  // Recent events log for the selected zone
  const recentEvents = useMemo(() => {
    if (!activeZone) return [];

    // Filter DB events for active zone if available
    const shortName = activeZone.name.toLowerCase().replace('hotspot', '').replace('hub', '').replace('corridor', '').trim();
    const matched = rawEvents.filter(e => {
      const zName = (e.zone || '').toLowerCase();
      return zName.includes(shortName) || shortName.includes(zName);
    });

    if (matched.length > 0) {
      return matched.slice(0, 4).map(e => {
        const isCrit = (e.severity >= 0.7);
        const isWatch = (e.severity >= 0.4 && e.severity < 0.7);
        const badgeClass = isCrit
          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
          : isWatch
          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
          : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30';
        const label = isCrit ? 'CRITICAL' : isWatch ? 'WATCH' : 'NORMAL';

        let icon = '📊';
        let title = 'Sensor Stream Update';
        if (e.source === 'weather') {
          icon = '🌧';
          title = `Precipitation (${e.value} mm/h)`;
        } else if (e.source === 'traffic') {
          icon = '🚗';
          title = e.event_type === 'congestion' ? `Congestion Spike (${e.value}%)` : `Transit Delay (+${e.value}m)`;
        } else if (e.source === 'incident') {
          icon = '💧';
          title = `Civic 311 Ticket Logged (${e.value} calls)`;
        }

        const dateObj = e.timestamp ? new Date(e.timestamp) : new Date();
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return {
          id: e.id,
          icon,
          title,
          description: e.raw_payload?.details || `Normalized ${e.source} event with severity score ${e.severity}`,
          time: timeStr,
          badgeClass,
          severityLabel: label
        };
      });
    }

    // Dynamic corridor stream events based on current zone telemetry
    const isCritZone = (activeZone.severity || '').toUpperCase() === 'CRITICAL';
    const isWatchZone = (activeZone.severity || '').toUpperCase() === 'MEDIUM' || (activeZone.severity || '').toUpperCase() === 'WATCH';
    const zoneBadgeClass = isCritZone
      ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
      : isWatchZone
      ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30';

    const speedNum = parseFloat(activeZone.speed) || 50;
    const rainNum = parseFloat(activeZone.rain) || 0;

    return [
      {
        id: 'evt-traffic',
        icon: '🚗',
        title: 'Traffic & Congestion Telemetry',
        description: `Corridor vehicular velocity: ${activeZone.speed} (Transit delay: +${activeZone.transit_delay || 0}m).`,
        time: 'T - 2m',
        badgeClass: speedNum < 15 ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30' : speedNum < 35 ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
        severityLabel: speedNum < 15 ? 'CRITICAL' : speedNum < 35 ? 'WATCH' : 'NORMAL'
      },
      {
        id: 'evt-weather',
        icon: '🌧',
        title: 'Precipitation Ingestion',
        description: `Precipitation rate at ${activeZone.rain} across corridor catchment.`,
        time: 'T - 5m',
        badgeClass: rainNum > 50 ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30' : rainNum > 10 ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
        severityLabel: rainNum > 50 ? 'CRITICAL' : rainNum > 10 ? 'WATCH' : 'NORMAL'
      },
      {
        id: 'evt-civic',
        icon: '💧',
        title: 'Citizen 311 Grievance Queue',
        description: (activeZone.reports || 0) > 0 ? `${activeZone.reports} active waterlogging reports submitted by residents.` : 'No citizen waterlogging grievances filed in corridor.',
        time: 'T - 8m',
        badgeClass: (activeZone.reports || 0) >= 5 ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30' : (activeZone.reports || 0) > 0 ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
        severityLabel: (activeZone.reports || 0) >= 5 ? 'CRITICAL' : (activeZone.reports || 0) > 0 ? 'WATCH' : 'NORMAL'
      },
      {
        id: 'evt-risk',
        icon: '🔮',
        title: 'Predictive Risk Evaluation',
        description: `ML model forecasts ${zoneRiskLevel} disruption risk (${probPercent}% probability).`,
        time: 'T - 12m',
        badgeClass: zoneBadgeClass,
        severityLabel: zoneRiskLevel
      }
    ];
  }, [activeZone, rawEvents, zoneRiskLevel, probPercent]);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Page Header */}
      <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[28px]">location_city</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl md:text-2xl font-bold font-headline-lg text-on-surface">
                CITY ZONES
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-[11px] font-mono font-bold text-primary">
                Simulation Step {currentStep}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium">
              Monitor disruption conditions across the city.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('map')}
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/25 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">map</span>
            View Full City Map
          </button>
        </div>
      </div>

      {/* 2. City-Wide Summary Bar */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
            CITY STATUS
          </span>
          <span className="text-xs text-on-surface-variant font-mono">
            {liveZones.length} Monitored Corridors
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase block">Critical Zones</span>
              <span className="text-xl font-extrabold text-rose-500 font-headline-lg">{criticalCount}</span>
            </div>
            <span className="text-xl select-none">🔴</span>
          </div>

          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase block">Watch Zones</span>
              <span className="text-xl font-extrabold text-amber-500 font-headline-lg">{watchCount}</span>
            </div>
            <span className="text-xl select-none">🟡</span>
          </div>

          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase block">Normal Zones</span>
              <span className="text-xl font-extrabold text-emerald-500 font-headline-lg">{normalCount}</span>
            </div>
            <span className="text-xl select-none">🟢</span>
          </div>

          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase block">Active Incidents</span>
              <span className="text-xl font-extrabold text-primary font-headline-lg">{activeIncidentsCount}</span>
            </div>
            <span className="material-symbols-outlined text-primary text-[24px]">warning</span>
          </div>
        </div>
      </div>

      {/* 3. Filters & Sorting Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/25 shadow-sm">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-xs font-mono text-on-surface-variant mr-1">Filter:</span>
          {['ALL', 'CRITICAL', 'WATCH', 'NORMAL'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'CRITICAL' ? '🔴 Critical' : st === 'WATCH' ? '🟡 Watch' : '🟢 Normal'}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-on-surface-variant whitespace-nowrap">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/25 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="RISK">Risk / Severity</option>
            <option value="INCIDENTS">Active Incidents</option>
            <option value="TRAFFIC">Traffic Congestion</option>
            <option value="NAME">Zone Name</option>
          </select>
        </div>
      </div>

      {/* 4. Main Section: Zone Cards Grid (Left) + Detail Panel with Status Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Zone Cards Grid */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredZones.map((zone) => {
              const status = getStatusBadge(zone.severity);
              const isSelected = zone.id === selectedZoneId;
              const zoneIncidents = zone.reports > 0 || zone.severity === 'CRITICAL' ? 1 : 0;
              const predRisk = zone.severity === 'CRITICAL' ? 'HIGH' : zone.severity === 'MEDIUM' ? 'MEDIUM' : 'LOW';

              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'bg-surface-container-high border-primary/50 shadow-md ring-2 ring-primary/30'
                      : 'bg-surface-container-low border-outline-variant/25 hover:bg-surface-container'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-base text-on-surface font-headline-sm block">
                          {zone.name.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          Corridor ID: {zone.id}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${status.classes}`}>
                        <span>{status.dot}</span>
                        <span>{status.label}</span>
                      </span>
                    </div>

                    {/* Zone Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                      <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                        <span className="text-[10px] text-on-surface-variant uppercase font-mono">Traffic</span>
                        <span className="font-bold text-on-surface">{zone.speed || 'Normal'}</span>
                      </div>
                      <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                        <span className="text-[10px] text-on-surface-variant uppercase font-mono">Rainfall</span>
                        <span className="font-bold text-secondary">{zone.rain || '0 mm/h'}</span>
                      </div>
                      <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                        <span className="text-[10px] text-on-surface-variant uppercase font-mono">Civic Reports</span>
                        <span className="font-bold text-error">{zone.reports || 0} tickets</span>
                      </div>
                      <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-0.5">
                        <span className="text-[10px] text-on-surface-variant uppercase font-mono">Predictive Risk</span>
                        <span className={`font-bold ${predRisk === 'HIGH' ? 'text-rose-500' : predRisk === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {predRisk}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Active Incidents & View Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15 text-xs">
                    <span className="text-on-surface-variant font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">warning</span>
                      Active Incidents: <strong>{zoneIncidents}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedZoneId(zone.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/20 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>View Zone</span>
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Zone Status Map & Zone Detail Inspector */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* 4. Zone Status Map */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                Zone Status Map
              </span>
              <span className="text-[11px] font-mono text-primary">
                Selected: {activeZone.name}
              </span>
            </div>

            {/* Embedded Leaflet Map */}
            <div className="w-full h-56 rounded-xl overflow-hidden border border-outline-variant/25 shadow-inner">
              <Map
                zones={liveZones}
                incident={activeZone.reports > 0 ? activeZone : null}
                onSelectZone={(z) => setSelectedZoneId(z.id)}
              />
            </div>
            <span className="text-[10px] text-on-surface-variant text-center font-mono">
              Monitored zone centers marked with status: 🔴 Critical &bull; 🟡 Watch &bull; 🟢 Normal
            </span>
          </div>

          {/* 5. Detailed Zone Inspector Panel */}
          {activeZone && (
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-5">
              {/* Zone Header & Status */}
              <div className="flex items-start justify-between gap-3 border-b border-outline-variant/15 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant tracking-wider block mb-1">
                    Zone Telemetry Inspector
                  </span>
                  <h2 className="text-xl font-bold font-headline-lg text-on-surface">
                    {activeZone.name.toUpperCase()}
                  </h2>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant">Current Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border flex items-center gap-1.5 ${getStatusBadge(activeZone.severity).classes}`}>
                    <span>{getStatusBadge(activeZone.severity).dot}</span>
                    <span>{getStatusBadge(activeZone.severity).label}</span>
                  </span>
                </div>
              </div>

              {/* WHY? Section */}
              <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase text-primary font-bold">
                  WHY?
                </span>
                <p className="text-xs text-on-surface leading-relaxed">
                  {activeZone.severity === 'CRITICAL'
                    ? 'Heavy rainfall coinciding with severe traffic congestion and increased citizen waterlogging reports.'
                    : activeZone.severity === 'MEDIUM'
                    ? 'Emerging cross-domain telemetry elevation observed across arterial routes.'
                    : 'Corridor telemetry remains within nominal dry baseline standard deviations.'}
                </p>
              </div>

              {/* CURRENT SIGNALS */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                  CURRENT SIGNALS
                </span>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
                    <span className="text-[10px] text-on-surface-variant uppercase font-mono flex items-center gap-1">
                      <span>🌧</span> Rainfall
                    </span>
                    <span className="text-sm font-bold text-secondary">{activeZone.rain || '0 mm/h'}</span>
                    <span className="text-[10px] text-on-surface-variant">Precipitation rate</span>
                  </div>

                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
                    <span className="text-[10px] text-on-surface-variant uppercase font-mono flex items-center gap-1">
                      <span>🚗</span> Traffic
                    </span>
                    <span className="text-sm font-bold text-primary">{activeZone.speed || 'Normal'}</span>
                    <span className="text-[10px] text-on-surface-variant">Transit delay: +{activeZone.transit_delay || 0}m</span>
                  </div>

                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
                    <span className="text-[10px] text-on-surface-variant uppercase font-mono flex items-center gap-1">
                      <span>💧</span> Civic Reports
                    </span>
                    <span className="text-sm font-bold text-error">{activeZone.reports || 0}</span>
                    <span className="text-[10px] text-on-surface-variant">311 waterlogging tickets</span>
                  </div>

                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
                    <span className="text-[10px] text-on-surface-variant uppercase font-mono flex items-center gap-1">
                      <span>🔮</span> Predictive Risk
                    </span>
                    <span className={`text-sm font-bold ${zoneRiskLevel === 'HIGH' ? 'text-rose-500' : zoneRiskLevel === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {zoneRiskLevel} ({probPercent}%)
                    </span>
                    <span className="text-[10px] text-on-surface-variant">30–60m horizon</span>
                  </div>
                </div>
              </div>

              {/* ACTIVE INCIDENTS Section */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                  ACTIVE INCIDENTS
                </span>

                {hasActiveIncident ? (
                  <div className="p-3.5 bg-surface-container rounded-xl border border-rose-500/25 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-rose-500">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      <span className="font-bold text-xs text-on-surface">{incidentName}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Confirmed multi-stream disruption event impacting arterial corridor flow and citizen complaints.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onNavigate('incidents')}
                        className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">description</span>
                        View Incident
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate('map')}
                        className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/25 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">map</span>
                        View on Map
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">No active critical incidents in this zone.</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('map')}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface text-xs font-medium hover:bg-surface-container transition-all cursor-pointer"
                    >
                      View on Map
                    </button>
                  </div>
                )}
              </div>

              {/* RECENT EVENTS & TIMELINE */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                    RECENT EVENTS & TIMELINE
                  </span>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    Corridor Log
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {recentEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-base select-none mt-0.5">{evt.icon}</span>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-on-surface text-xs">
                            {evt.title}
                          </span>
                          <span className="text-[11px] text-on-surface-variant leading-tight">
                            {evt.description}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          {evt.time}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${evt.badgeClass}`}>
                          {evt.severityLabel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 8. Predictive Risk Callout Card */}
              <div className="p-3.5 bg-surface-container rounded-xl border border-outline-variant/15 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono uppercase text-on-surface-variant">PREDICTIVE RISK</span>
                  <span className="text-xs font-bold text-on-surface">
                    {zoneRiskLevel} ({probPercent}% probability)
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Potential disruption in the next 30–60 minutes.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('predictions')}
                  className="px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-semibold border border-outline-variant/25 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[15px] text-primary">online_prediction</span>
                  View Prediction
                </button>
              </div>

              {/* Scientific Disclaimer */}
              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant italic">
                <strong>Scientific Guardrail:</strong> Monitored signals represent empirical sensor telemetry. <strong>Correlation detected; causation is not established.</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
