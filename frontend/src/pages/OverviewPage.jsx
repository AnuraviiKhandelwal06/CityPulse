import React from 'react';
import CityStatusCard from '../components/CityStatusCard';
import Map from '../components/Map';
import SignalsPanel from '../components/SignalsPanel';
import WhyThisAlertCard from '../components/WhyThisAlertCard';
import PredictiveRiskPanel from '../components/PredictiveRiskPanel';
import AiCityBrief from '../components/AiCityBrief';
import TimelineReplaySection from '../components/TimelineReplaySection';
import DataSourcesPanel from '../components/DataSourcesPanel';

export default function OverviewPage({
  vitals,
  incident,
  zones,
  sources,
  timeline,
  currentAlert,
  citySummary,
  prediction,
  isSimulating,
  replayPlaying,
  replayElapsed,
  replaySpeed,
  onSimulate,
  onTogglePlay,
  onSpeedChange,
  onSeek,
  onReset,
  onStepTimeline,
  onOpenWhy,
  onNavigate = () => {}
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* SECTION 1 — CITY STATUS */}
      <section aria-label="City Status Overview">
        <CityStatusCard
          alert={currentAlert}
          summary={citySummary}
          incident={incident}
          onOpenWhy={onOpenWhy}
          onBroadcast={() => onNavigate('response')}
          onReroute={() => onNavigate('response')}
        />
      </section>

      {/* SECTION 2 — MAIN MAP */}
      <section aria-label="Geographic Situational Map">
        <Map
          zones={zones}
          onSelectZone={(z) => {
            if (z.severity === 'CRITICAL' || z.id === 'malviya-nagar') {
              onOpenWhy();
            }
          }}
        />
      </section>

      {/* SECTION 3 — WHAT'S HAPPENING (Signals) */}
      <section aria-label="Live Sensor Signals">
        <SignalsPanel vitals={vitals} />
      </section>

      {/* SECTION 4, 5, 6 — CORE INTELLIGENCE ROW */}
      <section aria-label="Intelligence Analysis and Nowcast" className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* SECTION 4: WHY THIS ALERT? */}
        <div className="h-full">
          <WhyThisAlertCard
            alert={currentAlert}
            onOpenWhy={onOpenWhy}
          />
        </div>

        {/* SECTION 5: PREDICTIVE RISK (HistGradientBoosting ML Nowcast) */}
        <div className="h-full">
          <PredictiveRiskPanel prediction={prediction} />
        </div>

        {/* SECTION 6: AI CITY BRIEF */}
        <div className="h-full">
          <AiCityBrief
            alert={currentAlert}
            summary={citySummary}
            onInspectEvidence={onOpenWhy}
          />
        </div>
      </section>

      {/* SECTION 7 — TIMELINE & SIMULATION REPLAY */}
      <section aria-label="Timeline and Simulation Replay">
        <TimelineReplaySection
          isPlaying={isSimulating || replayPlaying}
          onTogglePlay={onTogglePlay}
          elapsedMinutes={replayElapsed}
          totalMinutes={30}
          speed={replaySpeed}
          onSpeedChange={onSpeedChange}
          onSeek={onSeek}
          onReset={onReset}
          onStepBack={() => onStepTimeline(-1)}
          onStepForward={() => onStepTimeline(1)}
          events={timeline}
        />
      </section>

      {/* SECTION 8 — DATA SOURCES */}
      <section aria-label="Live Data Sources">
        <DataSourcesPanel
          sources={sources}
          onOpenDataHub={() => onNavigate('data')}
        />
      </section>
    </div>
  );
}
