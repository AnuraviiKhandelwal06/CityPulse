import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import Header from './components/Header';
import AiCityBrief from './components/AiCityBrief';
import CriticalAlertBanner from './components/CriticalAlertBanner';
import CityVitalsPanel from './components/CityVitalsPanel';
import ActiveIncidentPanel from './components/ActiveIncidentPanel';
import Map from './components/Map';
import ReplayScrubber from './components/ReplayScrubber';
import DataSourcesPanel from './components/DataSourcesPanel';
import TimelinePanel from './components/TimelinePanel';
import WhyPanel from './components/WhyPanel';

export function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepLabel, setSimStepLabel] = useState('');

  // Live state from API or fallbacks
  const [vitals, setVitals] = useState(null);
  const [incident, setIncident] = useState(null);
  const [zones, setZones] = useState([]);
  const [sources, setSources] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [citySummary, setCitySummary] = useState(null);
  const [liveStatus, setLiveStatus] = useState('All systems live (synced)');

  // Replay scrubber state
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayElapsed, setReplayElapsed] = useState(20);
  const [replaySpeed, setReplaySpeed] = useState(1.0);

  // Helper fetch function supporting both direct port and Vite proxy
  const apiFetch = async (endpoint, options = {}) => {
    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, options);
      if (res.ok) return res;
    } catch (e) {
      // Fallback via relative path (Vite dev proxy)
    }
    return fetch(endpoint, options);
  };

  // Fetch live dashboard state from backend
  const fetchDashboardData = async () => {
    try {
      // 1. Metrics (City Vitals)
      let metricsData = null;
      const metricsRes = await apiFetch('/api/metrics');
      if (metricsRes.ok) {
        metricsData = await metricsRes.json();
        setVitals(metricsData);
      }

      // 2. Summary (AI City Brief)
      const summaryRes = await apiFetch('/api/summary');
      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setCitySummary(sumData);
      }

      // 3. Alerts
      const alertsRes = await apiFetch('/api/alerts');
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        if (alertsData && alertsData.length > 0) {
          const topAlert = alertsData[0];
          setCurrentAlert(topAlert);

          const weatherItem = topAlert.evidence_breakdown?.find(e => e.source === 'weather');
          const trafficItem = topAlert.evidence_breakdown?.find(e => e.source === 'traffic' && e.event_type !== 'transit_delay');
          const civicItem = topAlert.evidence_breakdown?.find(e => e.source === 'incident');

          setIncident({
            zone: topAlert.zone,
            sector: `${topAlert.zone} • Spatiotemporal multi-stream correlation`,
            alertType: `${topAlert.severity} Alert`,
            severityScore: Math.round((topAlert.severity_score || 0.86) * 100),
            severityLabel: topAlert.severity,
            confidenceScore: Math.round((topAlert.confidence || 0.92) * 100),
            confidenceLabel: topAlert.confidence >= 0.85 ? 'High' : 'Moderate',
            waterDepth: (metricsData?.rainfall?.value || 0) > 50 ? '18–24 cm underpass accumulation' : '4–8 cm surface accumulation',
            vehicleSpeed: trafficItem?.value || `${metricsData?.traffic?.value || 88}% (${metricsData?.traffic?.status || 'Severe congestion'})`,
            citizenReports: civicItem?.value || `${metricsData?.civicReports?.value || 14} flood reports`,
            rawAlert: topAlert
          });
        } else {
          setCurrentAlert(null);
          setIncident({
            zone: 'South Delhi Sector',
            sector: 'All corridors operating within normal baselines',
            alertType: 'Normal Status',
            severityScore: 12,
            severityLabel: 'Low',
            confidenceScore: 95,
            confidenceLabel: 'High',
            waterDepth: '0 cm (Dry / Clear flow)',
            vehicleSpeed: `${metricsData?.traffic?.value || 42}% (${metricsData?.traffic?.status || 'Smooth flow'})`,
            citizenReports: `${metricsData?.civicReports?.value || 0} active flood reports`
          });
        }
      }

      // 4. Zones for map
      const zonesRes = await apiFetch('/api/zones');
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        if (zonesData && zonesData.length > 0) {
          setZones(zonesData);
        }
      }

      // 5. Timeline
      const timelineRes = await apiFetch('/api/timeline');
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        if (timelineData && timelineData.length > 0) {
          setTimeline(timelineData);
        }
      }

      // 6. Data sources status (calculated dynamically)
      const simStatusRes = await apiFetch('/api/simulation/current');
      if (simStatusRes.ok) {
        const simStatus = await simStatusRes.json();
        const step = simStatus.current_step;
        setSources([
          {
            id: 'weather',
            name: 'Weather API (Open-Meteo)',
            status: 'Connected',
            metricLabel: 'Precipitation Radar',
            metricValue: metricsData?.rainfall ? `${metricsData.rainfall.value} ${metricsData.rainfall.unit} (${metricsData.rainfall.status})` : (step >= 1 ? '78.4 mm/h shower' : '1.2 mm/h clear'),
            metricColor: step >= 1 ? 'text-primary' : 'text-on-surface',
            online: true,
          },
          {
            id: 'traffic',
            name: 'Traffic Sensors & Loops',
            status: 'Connected',
            metricLabel: 'Malviya Ring Corridor',
            metricValue: metricsData?.traffic ? `${metricsData.traffic.value}${metricsData.traffic.unit} (${metricsData.traffic.status})` : (step >= 2 ? '84% (Gridlock)' : '42% (Smooth)'),
            metricColor: step >= 2 ? 'text-error' : 'text-tertiary',
            online: true,
          },
          {
            id: 'incidents',
            name: 'Municipal 311 Reports',
            status: 'Connected',
            metricLabel: 'Public Grievance Inflow',
            metricValue: metricsData?.civicReports ? `${metricsData.civicReports.value} ${metricsData.civicReports.unit}` : (step >= 3 ? '14 active flood calls' : '0 active calls'),
            metricColor: step >= 3 ? 'text-secondary' : 'text-on-surface-variant',
            online: true,
          },
        ]);
      }

      setLiveStatus('All systems live (synced)');
    } catch (err) {
      console.log('Error polling dashboard data:', err);
    }
  };

  // Periodic polling every 5s (disabled while actively animating simulation)
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      if (!isSimulating) {
        fetchDashboardData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Complete Simulation Flow: baseline -> rain -> traffic -> waterlogging -> multi-domain disruption
  const handleSimulateScenario = async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const scenarioSteps = [
      { step: 0, elapsed: 0, label: 'T+0m: Baseline Normal Operations Across Delhi', delay: 2400 },
      { step: 1, elapsed: 5, label: 'T+5m: Rainfall Anomaly Spikes (78.4 mm/h Surge)', delay: 2600 },
      { step: 2, elapsed: 10, label: 'T+10m: Traffic Congestion Spikes (Speed drops to 8.5 km/h)', delay: 2600 },
      { step: 3, elapsed: 15, label: 'T+15m: Citizen 311 Waterlogging Complaints Surge (14 calls)', delay: 2600 },
      { step: 4, elapsed: 20, label: 'T+20m: Multi-Source Disruption Detected & Surfaced!', delay: 0 },
    ];

    for (let i = 0; i < scenarioSteps.length; i++) {
      const s = scenarioSteps[i];
      setSimStepLabel(s.label);
      setReplayElapsed(s.elapsed);

      await apiFetch(`/api/simulation/set-step?step=${s.step}`, { method: 'POST' });
      await fetchDashboardData();

      if (s.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, s.delay));
      }
    }

    setIsSimulating(false);
    setTimeout(() => {
      setSimStepLabel('');
      setLiveStatus('All systems live (Critical alert active)');
    }, 4000);
  };

  // Timeline Step Back / Forward controls
  const handleStepTimeline = async (delta) => {
    try {
      const res = await apiFetch(`/api/simulation/step?delta=${delta}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReplayElapsed(data.current_step * 5);
        await fetchDashboardData();
      }
    } catch (e) {
      console.log('Error stepping timeline:', e);
    }
  };

  // Scrubber Seek
  const handleSeek = async (minutes) => {
    const step = Math.min(4, Math.max(0, Math.round(minutes / 5)));
    setReplayElapsed(minutes);
    try {
      await apiFetch(`/api/simulation/set-step?step=${step}`, { method: 'POST' });
      await fetchDashboardData();
    } catch (e) {
      console.log('Error seeking:', e);
    }
  };

  const handleReset = async () => {
    setReplayElapsed(0);
    try {
      await apiFetch('/api/simulation/reset', { method: 'POST' });
      await fetchDashboardData();
    } catch (e) {
      console.log('Error resetting simulation:', e);
    }
  };

  const handleExport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      vitals,
      incident,
      currentAlert,
      zones
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citypulse_incident_report_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      {/* 1. Fixed Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'evidence') {
            setIsWhyOpen(true);
          }
        }}
        onOpenEvidence={() => setIsWhyOpen(true)}
        criticalCount={currentAlert ? 1 : 0}
        emergingCount={3}
        normalCount={14}
        liveStatus={liveStatus}
        onSimulate={handleSimulateScenario}
        isSimulating={isSimulating}
        simStepLabel={simStepLabel}
        onExport={handleExport}
      />

      {/* 2. Main Body (pt-16 accounts for fixed header) */}
      <main className="w-full pt-16 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          {/* AI City Brief Section (Compact, Grounded, Non-Causal with Confidence & Disclaimer) */}
          <AiCityBrief
            alert={currentAlert}
            summary={citySummary}
            onInspectEvidence={() => setIsWhyOpen(true)}
          />

          {/* 3-Column Workspace Grid */}
          <div className="w-full px-margin-desktop py-space-sm grid grid-cols-1 xl:grid-cols-12 gap-gutter-desktop">
            {/* Left Column: City Vitals & Active Incident Spotlight */}
            <div className="xl:col-span-3 flex flex-col gap-space-md">
              <CityVitalsPanel vitals={vitals} />
              <ActiveIncidentPanel
                incident={incident}
                onOpenWhy={() => setIsWhyOpen(true)}
                onBroadcast={() => alert('Civil Defense Alert broadcast dispatched to local authorities.')}
                onReroute={() => alert('Dynamic traffic signal pre-emption active on Malviya Outer Corridors.')}
              />
            </div>

            {/* Center Column: Live Map & Replay Scrubber */}
            <div className="xl:col-span-6 flex flex-col gap-space-sm">
              <Map
                zones={zones}
                onSelectZone={(z) => {
                  if (z.severity === 'CRITICAL' || z.id === 'malviya-nagar') {
                    setIsWhyOpen(true);
                  }
                }}
              />
              <ReplayScrubber
                isPlaying={isSimulating || replayPlaying}
                onTogglePlay={() => {
                  if (isSimulating) {
                    setIsSimulating(false);
                  } else {
                    handleSimulateScenario();
                  }
                }}
                elapsedMinutes={replayElapsed}
                totalMinutes={30}
                speed={replaySpeed}
                onSpeedChange={(s) => setReplaySpeed(s)}
                onSeek={handleSeek}
                onReset={handleReset}
              />
            </div>

            {/* Right Column: Live Data Sources & Timeline of Events */}
            <div className="xl:col-span-3 flex flex-col gap-space-md">
              <DataSourcesPanel sources={sources} />
              <TimelinePanel
                events={timeline}
                onStepBack={() => handleStepTimeline(-1)}
                onStepForward={() => handleStepTimeline(1)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest py-space-md border-t border-outline-variant/20 mt-space-lg">
        <div className="w-full px-margin-desktop flex flex-col md:flex-row items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface-variant">
            <span className="font-semibold text-on-surface">CityPulse Operations</span>
            <span>•</span>
            <span className="text-tertiary flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              All telemetry feeds active
            </span>
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            &copy; 2025 Municipal Situational Intelligence Platform • Powered by Cross-Domain Geo Fusion
          </div>
        </div>
      </footer>

      {/* WHY Evidence Panel Modal */}
      <WhyPanel
        isOpen={isWhyOpen}
        onClose={() => {
          setIsWhyOpen(false);
          if (activeTab === 'evidence') {
            setActiveTab('overview');
          }
        }}
        alert={currentAlert}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
}
