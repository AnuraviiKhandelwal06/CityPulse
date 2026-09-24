import React, { useState } from 'react';

export default function IncidentsPage({
  incident = null,
  currentAlert = null,
  vitals = null,
  zones = [],
  currentStep = 4,
  onOpenWhy = () => {},
  onNavigate = () => {},
  onSeek = () => {}
}) {
  const [selectedZoneId, setSelectedZoneId] = useState('malviya-nagar');
  const [selectedNode, setSelectedNode] = useState('rain');
  const [activeStoryStage, setActiveStoryStage] = useState(currentStep + 1);

  // Available incident targets from zones / alerts
  const availableIncidents = [
    {
      id: 'malviya-nagar',
      name: 'Malviya Nagar Underpass',
      sector: 'South Delhi Sector • Spatiotemporal multi-stream correlation',
      status: currentAlert ? 'Critical Disruption' : 'Nominal Baseline',
      isAlert: !!currentAlert,
      lat: 28.5355,
      lon: 77.2065,
    },
    {
      id: 'connaught-place',
      name: 'Connaught Place Corridor',
      sector: 'Central Commercial Corridor',
      status: currentStep >= 2 ? 'Moderate Congestion' : 'Smooth Flow',
      isAlert: false,
      lat: 28.6304,
      lon: 77.2177,
    },
    {
      id: 'saket',
      name: 'Saket Corridor',
      sector: 'Southern Arterial Radial',
      status: 'Normal Operations',
      isAlert: false,
      lat: 28.5244,
      lon: 77.2140,
    },
    {
      id: 'nehru-place',
      name: 'Nehru Place Hub',
      sector: 'Commercial Transit Interchange',
      status: 'Normal Flow',
      isAlert: false,
      lat: 28.5494,
      lon: 77.2528,
    }
  ];

  const selectedIncident = availableIncidents.find(i => i.id === selectedZoneId) || availableIncidents[0];

  // Resolve dynamic values from live telemetry
  const isMalviya = selectedIncident.id === 'malviya-nagar';

  const rainVal = isMalviya
    ? (vitals?.rainfall?.value || (currentStep >= 1 ? 82.5 : 1.2))
    : (selectedIncident.id === 'connaught-place' ? (currentStep >= 1 ? 12.0 : 0.5) : 2.0);

  const trafficVal = isMalviya
    ? (vitals?.traffic?.value || (currentStep >= 2 ? 88 : 42))
    : (selectedIncident.id === 'connaught-place' ? (currentStep >= 2 ? 54 : 35) : 20);

  const civicVal = isMalviya
    ? (vitals?.civicReports?.value || (currentStep >= 3 ? 19 : 0))
    : 0;

  const delayVal = isMalviya
    ? (vitals?.transitDelay?.value || (currentStep >= 2 ? 26 : 2))
    : 3;

  const sevScore = isMalviya
    ? (currentAlert?.severity_score ? Math.round(currentAlert.severity_score * 100) : (currentStep >= 3 ? 86 : (currentStep >= 1 ? 48 : 12)))
    : (selectedIncident.id === 'connaught-place' ? (currentStep >= 2 ? 54 : 20) : 12);

  const confScore = isMalviya
    ? (currentAlert?.confidence ? Math.round(currentAlert.confidence * 100) : (currentStep >= 3 ? 95 : 85))
    : 88;

  const isCritical = sevScore >= 80;
  const isMedium = sevScore >= 40 && sevScore < 80;

  const statusBadgeBg = isCritical
    ? 'bg-error text-on-error'
    : isMedium
      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
      : 'bg-tertiary/20 text-tertiary border border-tertiary/30';

  // 1. Incident Story (5 Stages)
  const incidentStory = [
    {
      stage: 1,
      stepNum: 0,
      time: '10:00',
      elapsedMinutes: 0,
      title: 'Normal Baseline Operations',
      desc: 'All monitored corridors across South Delhi operating within seasonal baselines (Rain: 1.2 mm/h, Traffic: 42%, 0 Flood reports).',
      status: 'Normal',
      badgeBg: 'bg-tertiary/20 text-tertiary',
      icon: '🟢'
    },
    {
      stage: 2,
      stepNum: 1,
      time: '10:05',
      elapsedMinutes: 5,
      title: 'Cloudburst Rainfall Surge',
      desc: `Localized cloudburst precipitation surges to 78.4 mm/h (15.7x over baseline). Weather Doppler radar flags acute intensity anomaly.`,
      status: 'Weather Anomaly',
      badgeBg: 'bg-primary/20 text-primary',
      icon: '🌧'
    },
    {
      stage: 3,
      stepNum: 2,
      time: '10:10',
      elapsedMinutes: 10,
      title: 'Traffic Velocity Collapse',
      desc: `Arterial vehicle speed slows down to 8.5 km/h; congestion spikes to 84% (2.0x over baseline). Transit buses incur schedule delay.`,
      status: 'Traffic Anomaly',
      badgeBg: 'bg-error/20 text-error',
      icon: '🚗'
    },
    {
      stage: 4,
      stepNum: 3,
      time: '10:15',
      elapsedMinutes: 15,
      title: '311 Waterlogging Complaints Spike',
      desc: `14 citizen complaint calls logged within 30 minutes at Malviya Underpass (9.3x over municipal grievance baseline).`,
      status: 'Civic Anomaly',
      badgeBg: 'bg-secondary/20 text-secondary',
      icon: '💧'
    },
    {
      stage: 5,
      stepNum: 4,
      time: '10:20',
      elapsedMinutes: 20,
      title: 'Critical Multi-Domain Disruption',
      desc: 'Engine confirms spatiotemporal coincidence (within 0.8 km and 20 min). Unified Critical Alert generated with multi-stream confidence.',
      status: 'Critical Alert',
      badgeBg: 'bg-error text-on-error',
      icon: '🔴'
    }
  ];

  // 2. Interactive Event Graph Nodes
  const eventGraphNodes = {
    rain: {
      id: 'rain',
      name: 'Rainfall Anomaly',
      icon: '🌧',
      source: 'Open-Meteo Doppler Grid',
      sensorId: 'RADAR-DEL-104',
      timestamp: '10:05 IST (T+5m)',
      location: `${selectedIncident.name} Catchment (${selectedIncident.lat}° N, ${selectedIncident.lon}° E)`,
      value: `${rainVal} mm/h precipitation`,
      baseline: '5.0 mm/h standard baseline',
      anomaly: rainVal > 5 ? `${(rainVal / 5.0).toFixed(1)}x above baseline` : 'Nominal baseline bounds',
      impact: 'Initial triggering precipitation creating surface ponding and drainage saturation',
      activeBg: 'bg-primary-container/30 border-primary'
    },
    traffic: {
      id: 'traffic',
      name: 'Traffic Deterioration',
      icon: '🚗',
      source: 'Arterial Loops & GPS Telemetry',
      sensorId: 'LOOP-MAL-08',
      timestamp: '10:10 IST (T+10m)',
      location: `Corridor Radial at ${selectedIncident.name}`,
      value: `${trafficVal}% congestion (Speed: ${currentStep >= 3 ? '4.2' : (currentStep >= 2 ? '8.5' : '46.5')} km/h)`,
      baseline: '42% congestion (46.5 km/h normal baseline)',
      anomaly: trafficVal > 42 ? `${(trafficVal / 42.0).toFixed(1)}x baseline congestion` : 'Nominal arterial speed',
      impact: 'Arterial velocity drops, triggering queue formation and bus schedule variance',
      activeBg: 'bg-error-container/30 border-error'
    },
    waterlogging: {
      id: 'waterlogging',
      name: 'Waterlogging Complaints',
      icon: '💧',
      source: 'Municipal 311 Grievance Stream',
      sensorId: '311-TICKET-CLUSTER-912',
      timestamp: '10:15 IST (T+15m)',
      location: `${selectedIncident.name} Underpass Low-Point`,
      value: `${civicVal} verified flood complaints`,
      baseline: '1.5 complaints/hr seasonal average',
      anomaly: civicVal > 0 ? `${(civicVal / 1.5).toFixed(1)}x grievance surge` : 'Zero active citizen complaints',
      impact: 'Citizen-grounded physical ground truth verifying water depth and localized road blockage',
      activeBg: 'bg-secondary-container/30 border-secondary'
    },
    disruption: {
      id: 'disruption',
      name: 'Critical Disruption',
      icon: '🔴',
      source: 'Spatiotemporal Correlation Engine',
      sensorId: 'ENGINE-FUSION-NODE',
      timestamp: '10:20 IST (T+20m)',
      location: `${selectedIncident.name} Polygon (0.8 km radius)`,
      value: `Severity: ${sevScore}% • Confidence: ${confScore}%`,
      baseline: 'Thresholds: Dist &le; 2.0 km, Time &le; 30 min',
      anomaly: isCritical ? 'Cross-Domain Anomaly (3 independent streams synchronized)' : 'Nominal baseline synchronization',
      impact: 'Cross-agency response triggered: dynamic signal pre-emption, pump deployment, and civil alerts',
      activeBg: 'bg-error text-on-error'
    }
  };

  const currentNode = eventGraphNodes[selectedNode] || eventGraphNodes.rain;

  const handleJumpToReplay = (elapsedMins) => {
    onSeek(elapsedMins);
    onNavigate('replay');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner with Navigation & Incident Selection */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <button
              type="button"
              onClick={() => onNavigate('overview')}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer mr-2"
            >
              &larr; Back to Overview
            </button>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadgeBg}`}>
              {isCritical ? 'CRITICAL DISRUPTION' : isMedium ? 'MODERATE ANOMALY' : 'NOMINAL STATUS'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-xs font-mono font-medium text-on-surface">
              Confidence: {confScore}%
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold font-headline-lg text-on-surface">
            {selectedIncident.name}
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1 leading-relaxed">
            {selectedIncident.sector}
          </p>
        </div>

        {/* Incident Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-on-surface-variant uppercase">Select Incident:</span>
          <div className="flex flex-wrap items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline-variant/20">
            {availableIncidents.map((inc) => (
              <button
                key={inc.id}
                type="button"
                onClick={() => setSelectedZoneId(inc.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedZoneId === inc.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {inc.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenWhy}
            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ml-1"
          >
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            <span>View Evidence</span>
          </button>
        </div>
      </div>

      {/* SECTION 4 INTERACTIVE EVENT GRAPH */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline-variant/15">
          <div>
            <h2 className="text-base font-bold font-headline-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
              Interactive Incident Event Graph
            </h2>
            <p className="text-xs text-on-surface-variant">
              Rainfall &rarr; Traffic Deterioration &rarr; Waterlogging &rarr; Multi-Domain Disruption. Click any node to inspect telemetry.
            </p>
          </div>
          <span className="text-xs text-on-surface-variant/80 italic font-medium">
            Active: {currentNode.name}
          </span>
        </div>

        {/* 4 Interactive Graph Nodes with Flow Arrows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
          {Object.values(eventGraphNodes).map((node, idx) => {
            const isSelected = selectedNode === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? `${node.activeBg} shadow-md ring-2 ring-primary/40 scale-[1.02]`
                    : 'bg-surface-container border-outline-variant/25 hover:border-outline-variant/50 hover:bg-surface-container-high'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl select-none">{node.icon}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-semibold">
                    Node {idx + 1}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-on-surface">
                    {node.name}
                  </h3>
                  <span className="text-xs font-mono text-primary font-semibold block mt-0.5">
                    {node.value.split('•')[0]}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/15">
                  <span className="font-mono">{node.timestamp.split(' ')[0]}</span>
                  <span className="text-xs font-bold text-primary">
                    {isSelected ? '● Selected' : 'Click to Inspect &rarr;'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Node Telemetry Inspector */}
        <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 flex flex-col gap-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-outline-variant/15">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentNode.icon}</span>
              <div>
                <h4 className="font-bold text-sm text-on-surface">{currentNode.name} Telemetry</h4>
                <span className="text-[11px] text-on-surface-variant font-mono">Sensor ID: {currentNode.sensorId} | Source: {currentNode.source}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-on-surface bg-surface-container-high px-2.5 py-1 rounded-lg border border-outline-variant/20">
                {currentNode.timestamp}
              </span>
              <button
                type="button"
                onClick={onOpenWhy}
                className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Inspect Formula
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono block">Observed Value</span>
              <span className="font-bold text-on-surface text-sm mt-0.5 block">{currentNode.value}</span>
            </div>
            <div className="p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono block">Baseline Value</span>
              <span className="font-medium text-on-surface mt-0.5 block">{currentNode.baseline}</span>
            </div>
            <div className="p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono block">Anomaly Ratio</span>
              <span className="font-semibold text-error mt-0.5 block">{currentNode.anomaly}</span>
            </div>
            <div className="p-2.5 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
              <span className="text-[10px] text-on-surface-variant uppercase font-mono block">Sensor Coordinates</span>
              <span className="font-mono text-[11px] text-primary mt-0.5 block truncate">{currentNode.location}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-outline-variant/10">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <strong>Cross-Domain Impact:</strong> {currentNode.impact}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('map')}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>View On City Map</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3 INCIDENT STORY (Chronological Progression) */}
      <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-outline-variant/15">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">auto_stories</span>
            <h2 className="text-base font-bold font-headline-sm text-on-surface">
              Incident Story: How the Disruption Developed
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            Click any story card to inspect or jump to replay
          </span>
        </div>

        <div className="flex flex-col gap-3 relative pl-6">
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-outline-variant/30"></div>

          {incidentStory.map((step) => {
            const isStageActive = activeStoryStage === step.stage;
            return (
              <div
                key={step.stage}
                onClick={() => setActiveStoryStage(step.stage)}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  isStageActive
                    ? 'bg-primary-container/25 border-primary shadow-sm ring-1 ring-primary/30'
                    : 'bg-surface-container border-outline-variant/15 hover:border-outline-variant/40 hover:bg-surface-container-high'
                }`}
              >
                <div className={`absolute -left-6 top-5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                  isStageActive ? 'bg-primary border-white' : 'bg-surface-container-high border-primary'
                }`}></div>

                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl shrink-0 select-none">{step.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-primary">{step.time} (T+{step.elapsedMinutes}m)</span>
                      <span className="font-bold text-sm text-on-surface">{step.title}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-2xl">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${step.badgeBg}`}>
                    {step.status}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJumpToReplay(step.elapsedMinutes);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-bright text-primary text-xs font-semibold border border-outline-variant/20 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Jump to this exact moment in the Replay tool"
                  >
                    <span>Replay</span>
                    <span className="material-symbols-outlined text-[14px]">play_circle</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decoupled Scoring & Correlation Evidence Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Decoupled Severity vs Confidence */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">balance</span>
              Decoupled Scoring Architecture
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              CityPulse strictly decouples Severity (physical hazard magnitude) from Confidence (evidential corroboration tightness).
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-mono text-on-surface-variant">Severity Score</span>
                <span className="text-2xl font-bold text-error">{sevScore}%</span>
                <span className="text-[11px] text-error font-medium">{isCritical ? 'Critical Band (> 0.80)' : isMedium ? 'Moderate Band' : 'Low / Nominal'}</span>
                <span className="text-[10px] text-on-surface-variant/80 mt-1">Weighted physical composite across rain, gridlock, and 311 calls</span>
              </div>

              <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/15 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-mono text-on-surface-variant">Confidence Rating</span>
                <span className="text-2xl font-bold text-primary">{confScore}%</span>
                <span className="text-[11px] text-primary font-medium">Multi-Stream Grounded</span>
                <span className="text-[10px] text-on-surface-variant/80 mt-1">Derived from independent corroborating streams in space &amp; time</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-outline-variant/15 flex justify-end">
            <button
              type="button"
              onClick={onOpenWhy}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect scoring mathematical weights</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Scientific Non-Causal Grounding */}
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/25 shadow-sm flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">verified</span>
              Scientific Grounding &amp; Non-Causal Policy
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              CityPulse surfaces spatiotemporal coincidence across independent municipal streams without asserting unsubstantiated physical causality.
            </p>
            <div className="p-3 bg-surface-container rounded-xl border border-amber-500/20 text-xs italic text-on-surface leading-relaxed mt-1">
              "Heavy rainfall is coinciding with severe traffic congestion and rising waterlogging reports around {selectedIncident.name} within a 0.8 km radius and 20-minute window. <strong>Correlation detected; causation is not established.</strong>"
            </div>
          </div>

          <div className="text-[11px] text-on-surface-variant/70 border-t border-outline-variant/15 pt-2 flex items-center justify-between">
            <span>Spatial Threshold: &le; 2.0 km</span>
            <span>Temporal Window: &le; 30 min</span>
          </div>
        </div>
      </div>
    </div>
  );
}
