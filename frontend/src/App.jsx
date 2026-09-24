import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import Header from './components/Header';
import OverviewPage from './pages/OverviewPage';
import CityMapPage from './pages/CityMapPage';
import IncidentsPage from './pages/IncidentsPage';
import PredictionsPage from './pages/PredictionsPage';
import ReplayPage from './pages/ReplayPage';
import WhatIfSimulatorPage from './pages/WhatIfSimulatorPage';
import CityZonesPage from './pages/CityZonesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AskCityPulsePage from './pages/AskCityPulsePage';
import DataHubPage from './pages/DataHubPage';
import ResponseCenterPage from './pages/ResponseCenterPage';
import WhyPanel from './components/WhyPanel';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[CityPulse PageErrorBoundary caught error]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl bg-surface-container-low border border-error/30 flex flex-col items-center justify-center text-center gap-3 my-8">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-on-surface">Page Render Error Encountered</h2>
          <p className="text-xs text-on-surface-variant max-w-lg leading-relaxed">
            A client-side error occurred while rendering this page component.
          </p>
          <div className="p-3 bg-surface-container rounded-xl font-mono text-[11px] text-error border border-error/20 max-w-md text-left">
            <strong>Error:</strong> {this.state.error?.message || String(this.state.error)}
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold cursor-pointer"
          >
            &larr; Return to Overview
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function DashboardContent() {
  // Navigation / Routing state (synced with hash, supporting both #/page and #page)
  const getPageFromHash = () => {
    let hash = window.location.hash.replace(/^[#/]+/, '').toLowerCase();
    if (hash === 'what-if' || hash === 'whatif') hash = 'simulate';
    if (hash === 'prediction') hash = 'predictions';
    if (hash === 'incident') hash = 'incidents';
    if (hash === 'zone') hash = 'zones';
    if (hash === 'data-hub') hash = 'data';
    if (hash === 'response-center') hash = 'response';

    const validPages = [
      'overview', 'map', 'incidents', 'predictions', 'replay',
      'simulate', 'zones', 'analytics', 'ask', 'data', 'response'
    ];
    return validPages.includes(hash) ? hash : 'overview';
  };

  const [currentPage, setCurrentPage] = useState(getPageFromHash);
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStepLabel, setSimStepLabel] = useState('');

  // Handle Hash Navigation
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page) => {
    window.location.hash = `#/${page}`;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Live state from API or fallbacks
  const [vitals, setVitals] = useState(null);
  const [incident, setIncident] = useState(null);
  const [zones, setZones] = useState([]);
  const [sources, setSources] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [citySummary, setCitySummary] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [liveStatus, setLiveStatus] = useState('All systems live (synced)');

  // Replay scrubber state
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayElapsed, setReplayElapsed] = useState(20);
  const [replaySpeed, setReplaySpeed] = useState(1.0);

  // Helper fetch function supporting both direct port and Vite proxy
  const apiFetch = async (endpoint, options = {}) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, options);
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

      // 3. Predictive Risk Nowcast
      try {
        const predRes = await apiFetch('/api/prediction');
        if (predRes.ok) {
          const predData = await predRes.json();
          setPrediction(predData);
        }
      } catch (e) {
        // Fallback handled in component
      }

      // 4. Alerts
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
            citizenReports: civicItem?.value || `${metricsData?.civicReports?.value || 19} flood reports`,
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

      // 5. Zones for map
      const zonesRes = await apiFetch('/api/zones');
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        if (zonesData && zonesData.length > 0) {
          setZones(zonesData);
        }
      }

      // 6. Timeline
      const timelineRes = await apiFetch('/api/timeline');
      if (timelineRes.ok) {
        const timelineData = await timelineRes.json();
        if (timelineData && timelineData.length > 0) {
          setTimeline(timelineData);
        }
      }

      // 7. Data sources status
      const simStatusRes = await apiFetch('/api/simulation/current');
      if (simStatusRes.ok) {
        const simStatus = await simStatusRes.json();
        const step = simStatus.current_step;
        setSources([
          {
            id: 'weather',
            name: 'Weather API (Open-Meteo)',
            status: 'Connected',
            metricLabel: 'Precipitation',
            metricValue: metricsData?.rainfall ? `${metricsData.rainfall.value} ${metricsData.rainfall.unit}` : (step >= 1 ? '82.5 mm/h' : '1.2 mm/h'),
            metricColor: step >= 1 ? 'text-primary' : 'text-on-surface',
            online: true,
          },
          {
            id: 'traffic',
            name: 'Traffic Sensors & Loops',
            status: 'Connected',
            metricLabel: 'Congestion',
            metricValue: metricsData?.traffic ? `${metricsData.traffic.value}${metricsData.traffic.unit}` : (step >= 2 ? '88%' : '42%'),
            metricColor: step >= 2 ? 'text-error' : 'text-tertiary',
            online: true,
          },
          {
            id: 'incidents',
            name: 'Municipal 311 Reports',
            status: 'Connected',
            metricLabel: 'Complaints',
            metricValue: metricsData?.civicReports ? `${metricsData.civicReports.value} ${metricsData.civicReports.unit}` : (step >= 3 ? '19 reports' : '0 reports'),
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
      zones,
      predictiveRisk: prediction
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citypulse_incident_report_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col">
      {/* 1. Universal Top Header with Navigation */}
      <Header
        activePage={currentPage}
        onNavigate={handleNavigate}
        liveStatus={liveStatus}
        onSimulate={handleSimulateScenario}
        isSimulating={isSimulating}
        simStepLabel={simStepLabel}
        onExport={handleExport}
      />

      {/* 2. Main Page View Container */}
      <main className="w-full pt-20 pb-12 px-4 md:px-8 max-w-7xl mx-auto flex-1 flex flex-col gap-6">
        <PageErrorBoundary onReset={() => handleNavigate('overview')}>
          {currentPage === 'overview' && (
          <OverviewPage
            vitals={vitals}
            incident={incident}
            zones={zones}
            sources={sources}
            timeline={timeline}
            currentAlert={currentAlert}
            citySummary={citySummary}
            prediction={prediction}
            isSimulating={isSimulating}
            replayPlaying={replayPlaying}
            replayElapsed={replayElapsed}
            replaySpeed={replaySpeed}
            onSimulate={handleSimulateScenario}
            onTogglePlay={() => {
              if (isSimulating) {
                setIsSimulating(false);
              } else {
                handleSimulateScenario();
              }
            }}
            onSpeedChange={(s) => setReplaySpeed(s)}
            onSeek={handleSeek}
            onReset={handleReset}
            onStepTimeline={handleStepTimeline}
            onOpenWhy={() => setIsWhyOpen(true)}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'map' && (
          <CityMapPage
            zones={zones}
            currentAlert={currentAlert}
            incident={incident}
            onOpenWhy={() => setIsWhyOpen(true)}
          />
        )}

        {currentPage === 'incidents' && (
          <IncidentsPage
            incident={incident}
            currentAlert={currentAlert}
            vitals={vitals}
            zones={zones}
            currentStep={Math.min(4, Math.max(0, Math.round(replayElapsed / 5)))}
            onOpenWhy={() => setIsWhyOpen(true)}
            onNavigate={handleNavigate}
            onSeek={handleSeek}
          />
        )}

        {currentPage === 'predictions' && (
          <PredictionsPage
            currentStep={Math.min(4, Math.max(0, Math.round(replayElapsed / 5)))}
            apiFetch={apiFetch}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'replay' && (
          <ReplayPage
            isSimulating={isSimulating}
            replayPlaying={replayPlaying}
            replayElapsed={replayElapsed}
            replaySpeed={replaySpeed}
            onTogglePlay={() => {
              if (isSimulating) {
                setIsSimulating(false);
              } else {
                handleSimulateScenario();
              }
            }}
            onSpeedChange={(s) => setReplaySpeed(s)}
            onSeek={handleSeek}
            onReset={handleReset}
            onStepTimeline={handleStepTimeline}
            vitals={vitals}
            currentAlert={currentAlert}
            prediction={prediction}
            timeline={timeline}
          />
        )}

        {currentPage === 'simulate' && (
          <WhatIfSimulatorPage
            apiFetch={apiFetch}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'zones' && (
          <CityZonesPage
            zones={zones}
            currentAlert={currentAlert}
            vitals={vitals}
            currentStep={Math.min(4, Math.max(0, Math.round(replayElapsed / 5)))}
            apiFetch={apiFetch}
            onNavigate={handleNavigate}
            onOpenWhy={() => setIsWhyOpen(true)}
          />
        )}

        {currentPage === 'analytics' && (
          <AnalyticsPage
            apiFetch={apiFetch}
            onNavigate={handleNavigate}
            currentStep={Math.min(4, Math.max(0, Math.round(replayElapsed / 5)))}
            zones={zones}
            vitals={vitals}
          />
        )}

        {currentPage === 'ask' && (
          <AskCityPulsePage
            apiFetch={apiFetch}
            onNavigate={handleNavigate}
            currentStep={Math.min(4, Math.max(0, Math.round(replayElapsed / 5)))}
          />
        )}

        {currentPage === 'data' && (
          <DataHubPage
            apiFetch={apiFetch}
            onNavigate={handleNavigate}
            currentStep={Math.min(4, Math.max(0, Math.round(replayElapsed / 5)))}
          />
        )}

        {currentPage === 'response' && (
          <ResponseCenterPage
            apiFetch={apiFetch}
            onNavigate={handleNavigate}
            currentStep={Math.min(4, Math.max(0, Math.round(replayElapsed / 5)))}
            onOpenWhy={() => setIsWhyOpen(true)}
          />
        )}
        </PageErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="w-full bg-surface-container-lowest py-4 border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">CityPulse</span>
            <span>&bull;</span>
            <span>Municipal Situational Intelligence Platform</span>
            <span>&bull;</span>
            <span className="text-tertiary font-medium">Empirical Cross-Domain Fusion</span>
          </div>
          <div className="italic text-[11px]">
            Correlation detected; causation is not established.
          </div>
        </div>
      </footer>

      {/* Universal Evidence & Analysis Modal (Accessible anywhere via onOpenWhy) */}
      <WhyPanel
        isOpen={isWhyOpen}
        onClose={() => setIsWhyOpen(false)}
        alert={currentAlert}
        prediction={prediction}
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
