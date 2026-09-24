import React from 'react';
import { useTheme } from '../theme/ThemeProvider';

export default function Header({
  activeTab = 'overview',
  setActiveTab = () => {},
  onOpenEvidence = () => {},
  criticalCount = 1,
  emergingCount = 3,
  normalCount = 14,
  liveStatus = 'All systems live (5s ago)',
  onSimulate = () => {},
  isSimulating = false,
  simStepLabel = '',
  onExport = () => {}
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-b border-outline-variant/20">
      <div className="h-16 w-full px-margin-desktop flex items-center justify-between gap-space-lg">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-space-lg">
          <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">radar</span>
            </div>
            <div>
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">CityPulse</span>
              <span className="text-body-sm text-on-surface-variant block font-normal">Urban Situational Dashboard</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container-high border border-outline-variant/30 ml-2">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium">
                {simStepLabel ? simStepLabel : liveStatus}
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-space-xs">
            <div
              className={`flex items-center gap-1 px-space-sm py-1 rounded-full font-body-sm font-semibold transition-all ${
                criticalCount > 0
                  ? 'bg-error-container/40 text-error cursor-pointer'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
              onClick={() => {
                if (criticalCount > 0) onOpenEvidence();
              }}
              title={criticalCount > 0 ? 'Click to inspect critical alert evidence' : 'No critical alerts'}
            >
              {criticalCount > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                  <span>{criticalCount} Critical Alert</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                  <span>0 Critical</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 px-space-sm py-1 rounded-full bg-primary/20 text-primary font-body-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>{emergingCount} Emerging</span>
            </div>
            <div className="flex items-center gap-1 px-space-sm py-1 rounded-full bg-tertiary-container/20 text-tertiary font-body-sm font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span>{normalCount} Normal</span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-space-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-space-md py-1.5 rounded-lg font-body-md font-medium transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'text-on-primary-container bg-primary-container shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            Overview &amp; Map
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('evidence');
              onOpenEvidence();
            }}
            className={`px-space-md py-1.5 rounded-lg font-body-md font-medium transition-colors cursor-pointer ${
              activeTab === 'evidence'
                ? 'text-on-primary-container bg-primary-container shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            Incident Evidence
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('replay');
              onSimulate();
            }}
            className={`px-space-md py-1.5 rounded-lg font-body-md font-medium transition-colors cursor-pointer ${
              activeTab === 'replay'
                ? 'text-on-primary-container bg-primary-container shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            Simulation Replay
          </button>
        </nav>

        {/* Right: Actions, Theme Toggle, Profile */}
        <div className="flex items-center gap-space-sm">
          <button
            className={`flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg font-body-sm font-medium transition-colors cursor-pointer shadow-sm ${
              isSimulating
                ? 'bg-error text-white animate-pulse'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
            type="button"
            onClick={onSimulate}
            title="Play the 5-stage demo scenario: baseline → rain → traffic → waterlogging → disruption"
          >
            <span className={`material-symbols-outlined text-[16px] ${isSimulating ? 'animate-spin' : ''}`}>
              {isSimulating ? 'sync' : 'play_circle'}
            </span>
            <span>{isSimulating ? 'Simulating...' : 'Simulate Scenario'}</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm font-medium transition-colors cursor-pointer"
            type="button"
            onClick={onExport}
          >
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">ios_share</span>
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center cursor-pointer transition-colors text-on-surface border border-outline-variant/30"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <div className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-bright flex items-center justify-center cursor-pointer transition-colors ml-1 border border-outline-variant/30">
            <span className="material-symbols-outlined text-on-surface text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
