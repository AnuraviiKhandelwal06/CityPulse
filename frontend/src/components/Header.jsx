import React from 'react';
import { useTheme } from '../theme/ThemeProvider';

export default function Header({
  activePage = 'overview',
  onNavigate = () => {},
  liveStatus = 'All systems live',
  onSimulate = () => {},
  isSimulating = false,
  simStepLabel = '',
  onExport = () => {}
}) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'map', label: 'City Map', icon: 'map' },
    { id: 'incidents', label: 'Incidents', icon: 'warning' },
    { id: 'predictions', label: 'Predictions', icon: 'online_prediction' },
    { id: 'ask', label: 'Ask', icon: 'forum' },
    { id: 'response', label: 'Response', icon: 'crisis_alert' },
    { id: 'simulate', label: 'What-If', icon: 'tune' },
    { id: 'replay', label: 'Replay', icon: 'replay' },
    { id: 'zones', label: 'Zones', icon: 'location_city' },
    { id: 'analytics', label: 'Analytics', icon: 'monitoring' },
    { id: 'data', label: 'Data Hub', icon: 'hub' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-sm border-b border-outline-variant/20">
      <div className="h-16 w-full px-4 md:px-8 flex items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">radar</span>
            </div>
            <div>
              <span className="font-headline-sm text-base md:text-lg font-bold tracking-tight text-on-surface">
                CityPulse
              </span>
            </div>
          </div>

          {/* Clean Single Status Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/25 ml-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-amber-400 animate-ping' : 'bg-tertiary animate-pulse'}`}></span>
            <span className="font-medium text-on-surface">
              {simStepLabel ? simStepLabel : liveStatus}
            </span>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body-sm font-semibold text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Actions, Export, Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSimulate}
            className={`flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl font-bold text-xs md:text-sm transition-all shadow-sm cursor-pointer ${
              isSimulating
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-primary text-on-primary hover:bg-primary/90 hover:shadow-md'
            }`}
            title="Play the 5-stage simulation scenario: baseline → rain → traffic → waterlogging → disruption"
          >
            <span className={`material-symbols-outlined text-[17px] ${isSimulating ? 'animate-spin' : ''}`}>
              {isSimulating ? 'sync' : 'play_circle'}
            </span>
            <span className="hidden sm:inline">{isSimulating ? 'Simulating...' : 'Simulate'}</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs md:text-sm border border-outline-variant/30 transition-colors cursor-pointer"
            title="Export JSON incident report"
          >
            <span className="material-symbols-outlined text-[17px] text-on-surface-variant">ios_share</span>
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center cursor-pointer transition-colors text-on-surface border border-outline-variant/30"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
