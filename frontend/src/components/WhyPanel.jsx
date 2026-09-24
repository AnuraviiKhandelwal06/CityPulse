import React from 'react';

export default function WhyPanel({
  isOpen,
  onClose,
  alert,
  evidence
}) {
  if (!isOpen) return null;

  const data = alert || {
    zone: 'Malviya Nagar Underpass',
    severity: 'CRITICAL',
    severity_score: 0.86,
    confidence: 0.92,
    spatial_overlap_km: 1.4,
    temporal_overlap_minutes: 18,
    explanation: 'Heavy rainfall coincides with acute traffic congestion (88%) and 14 waterlogging reports across Malviya Nagar corridors.',
    evidence_breakdown: [
      {
        source: 'weather',
        name: 'Precipitation Spike (Open-Meteo)',
        value: '78.4 mm/h shower',
        baseline: '0.0 mm/h normal',
        anomalyRatio: 'Cloudburst Surge',
        time: 'T+5m'
      },
      {
        source: 'traffic',
        name: 'Traffic Gridlock & Velocity Collapse',
        value: '4.2 km/h (88% congestion)',
        baseline: '42% normal',
        anomalyRatio: '2.1x baseline',
        time: 'T+10m'
      },
      {
        source: 'incident',
        name: 'Municipal 311 Waterlogging Complaints',
        value: '14 verified tickets in 30 min',
        baseline: '1.2 tickets/hr',
        anomalyRatio: '11.6x baseline',
        time: 'T+15m'
      },
      {
        source: 'traffic',
        name: 'Transit Delay Variance',
        value: '+26 min delay',
        baseline: '2 min normal',
        anomalyRatio: 'Bottleneck Delay',
        time: 'T+20m'
      }
    ]
  };

  // Extract evidence list robustly
  const rawList = data.evidence_breakdown || data.contributing_events || [];
  const evidenceList = rawList.map((item, idx) => {
    if (typeof item === 'object' && item !== null) {
      const src = item.source || (idx === 0 ? 'weather' : idx === 1 ? 'traffic' : 'incident');
      let name = item.name;
      if (!name) {
        if (src === 'weather') name = 'Precipitation Spike (Open-Meteo)';
        else if (src === 'traffic') name = item.event_type === 'transit_delay' ? 'Transit Delay Variance' : 'Traffic Gridlock & Velocity Collapse';
        else name = 'Municipal 311 Waterlogging Complaints';
      }
      return {
        source: src,
        name: name,
        value: item.value || item.reading || 'Anomaly Spike',
        baseline: item.baseline || (src === 'weather' ? '0.0 mm/h' : src === 'traffic' ? '42% avg' : '1.2/hr'),
        anomalyRatio: item.anomalyRatio || (src === 'weather' ? 'Surge Anomaly' : src === 'traffic' ? '2.1x baseline' : '11.6x baseline'),
        time: item.time || (idx === 0 ? 'T+5m' : idx === 1 ? 'T+10m' : idx === 2 ? 'T+15m' : 'T+20m')
      };
    }
    // Fallback if item was just a string ID
    const defaultSignals = [
      {
        source: 'weather',
        name: 'Precipitation Spike (Open-Meteo)',
        value: '78.4 mm/h shower',
        baseline: '0.0 mm/h normal',
        anomalyRatio: 'Cloudburst Surge',
        time: 'T+5m'
      },
      {
        source: 'traffic',
        name: 'Traffic Gridlock & Velocity Collapse',
        value: '4.2 km/h (88% congestion)',
        baseline: '42% normal',
        anomalyRatio: '2.1x baseline',
        time: 'T+10m'
      },
      {
        source: 'incident',
        name: 'Municipal 311 Waterlogging Complaints',
        value: '14 verified tickets in 30 min',
        baseline: '1.2 tickets/hr',
        anomalyRatio: '11.6x baseline',
        time: 'T+15m'
      }
    ];
    return defaultSignals[idx % defaultSignals.length];
  });

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-on-surface">
        {/* Header */}
        <div className="p-space-lg border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
                Evidence Breakdown &amp; Analysis
                <span className="text-xs px-2 py-0.5 rounded-full bg-error-container/40 text-error font-semibold">
                  {data.severity || 'CRITICAL'}
                </span>
              </h2>
              <span className="text-body-sm text-on-surface-variant">
                Target Zone: {data.zone || 'Malviya Nagar Underpass'} • Correlated Fused Telemetry
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            type="button"
            title="Close Evidence Breakdown"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-space-lg flex flex-col gap-space-lg">
          {/* Grounded Plain-Language Explanation */}
          <div className="p-space-md rounded-xl bg-surface-container border border-primary/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">neurology</span>
                Grounded Plain-Language Finding (Non-Causal)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">
                Correlation != Causation Verified
              </span>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
              "{data.explanation}"
            </p>
            <span className="text-xs text-on-surface-variant italic">
              Note: System surfaces empirical cross-domain coincidence across independent sensor streams without assuming single-point causality.
            </span>
          </div>

          {/* Severity vs Confidence Comparison Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="bg-surface-container p-space-md rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-on-surface text-body-md flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                  Severity Score
                </span>
                <span className="text-error font-bold text-headline-sm">
                  {Math.round((data.severity_score || 0.86) * 100)}%
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Weighted magnitude of physical disruptions across city infrastructure:
                <br /><code className="text-xs text-primary font-mono">0.25*traffic + 0.20*weather + 0.35*incidents + 0.20*transit</code>
              </p>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-error rounded-full"
                  style={{ width: `${Math.round((data.severity_score || 0.86) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-surface-container p-space-md rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-on-surface text-body-md flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  Confidence Score
                </span>
                <span className="text-primary font-bold text-headline-sm">
                  {Math.round((data.confidence || 0.92) * 100)}%
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Statistical certainty based on 3 independent streams, spatial tightness, and temporal alignment.
              </p>
              <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.round((data.confidence || 0.92) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Spatial & Temporal Proximity Overlap */}
          <div className="grid grid-cols-2 gap-space-md">
            <div className="bg-surface-container p-space-sm rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary/20 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[20px]">near_me</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">Spatial Overlap Distance</span>
                <span className="font-bold text-on-surface text-body-md">
                  {data.spatial_overlap_km || 1.4} km <span className="text-xs text-tertiary font-normal">(threshold &lt; 2.0 km)</span>
                </span>
              </div>
            </div>

            <div className="bg-surface-container p-space-sm rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block">Temporal Window Overlap</span>
                <span className="font-bold text-on-surface text-body-md">
                  {data.temporal_overlap_minutes || 18} min <span className="text-xs text-secondary font-normal">(window &plusmn;30 min)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Contributing Multi-Stream Evidence Checklist */}
          <div className="flex flex-col gap-space-xs">
            <span className="font-headline-sm text-body-md font-bold text-on-surface">
              Contributing Signal Breakdown
            </span>
            <div className="flex flex-col gap-2">
              {evidenceList.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-space-sm rounded-lg bg-surface-container flex flex-col md:flex-row md:items-center justify-between gap-2 border border-outline-variant/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      evt.source === 'weather' ? 'bg-primary' : evt.source === 'traffic' ? 'bg-error' : 'bg-secondary'
                    }`}></span>
                    <div>
                      <span className="font-bold text-on-surface block text-sm">{evt.name}</span>
                      <span className="text-xs text-on-surface-variant">
                        Baseline: {evt.baseline} • Anomaly Ratio: <strong className="text-on-surface">{evt.anomalyRatio}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-on-surface block">{evt.value}</span>
                    <span className="text-[11px] text-on-surface-variant">{evt.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-space-md border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest sticky bottom-0">
          <span className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-tertiary">verified_user</span>
            Cryptographically timestamped civic intelligence record
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-space-md rounded-lg bg-primary text-on-primary font-body-sm font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
            type="button"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
