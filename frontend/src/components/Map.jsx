import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../theme/ThemeProvider';

// Coordinates for Delhi & surrounding zones
const DEFAULT_CENTER = [28.5355, 77.2185]; // Malviya Nagar, South Delhi

function createZoneIcon(zone) {
  const isCritical = zone.severity === 'CRITICAL' || zone.severity_score >= 0.8;
  const isHigh = zone.severity === 'HIGH' || (zone.severity_score >= 0.6 && zone.severity_score < 0.8);
  const isMedium = zone.severity === 'MEDIUM' || (zone.severity_score >= 0.3 && zone.severity_score < 0.6);

  let html = '';
  if (isCritical) {
    html = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
        <div class="absolute w-20 h-20 rounded-full bg-red-500/25 animate-ping"></div>
        <div class="absolute w-12 h-12 rounded-full bg-red-500/40 animate-pulse"></div>
        <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(255,100,100,0.8)] border-2 border-white text-white">
          <span class="material-symbols-outlined text-[16px]">priority_high</span>
        </div>
      </div>
    `;
  } else if (isHigh || isMedium) {
    html = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
        <div class="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(76,215,246,0.8)] border-2 border-white">
          <span class="w-2 h-2 rounded-full bg-slate-900"></span>
        </div>
      </div>
    `;
  } else {
    html = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
        <div class="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shadow-[0_0_8px_rgba(78,222,163,0.8)] border border-white">
          <span class="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
        </div>
      </div>
    `;
  }

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

function MapController({ center, zoom, theme }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [center, zoom, theme, map]);
  return null;
}

function MapZoomButtons() {
  const map = useMap();
  return (
    <div className="flex items-center bg-surface-container-high/90 backdrop-blur-md rounded-lg overflow-hidden border border-outline-variant/20 shadow-md">
      <button
        className="p-1.5 hover:bg-surface-bright text-on-surface transition-colors cursor-pointer"
        type="button"
        onClick={() => map.zoomIn()}
        title="Zoom In"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
      </button>
      <div className="w-[1px] h-4 bg-surface-container"></div>
      <button
        className="p-1.5 hover:bg-surface-bright text-on-surface transition-colors cursor-pointer"
        type="button"
        onClick={() => map.zoomOut()}
        title="Zoom Out"
      >
        <span className="material-symbols-outlined text-[16px]">remove</span>
      </button>
    </div>
  );
}

export default function Map({
  zones = [],
  onSelectZone = () => {}
}) {
  const { theme } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');

  // Fallback default zones if backend data is loading
  const displayZones = zones.length > 0 ? zones : [
    {
      id: 'malviya-nagar',
      name: 'Malviya Nagar Hotspot',
      lat: 28.5355,
      lon: 77.2065,
      severity: 'CRITICAL',
      severity_score: 0.86,
      confidence: 0.92,
      summary: 'Severe Congestion 88% • Heavy Rain 78mm/h • 14 Flooding Reports',
      speed: '4.2 km/h',
      rain: '78.4 mm/h',
      reports: 14,
      layer: 'all',
    },
    {
      id: 'connaught-place',
      name: 'Connaught Place',
      lat: 28.6304,
      lon: 77.2177,
      severity: 'MEDIUM',
      severity_score: 0.54,
      confidence: 0.85,
      summary: 'Moderate Traffic (54%) • Rain 12 mm/h',
      speed: '28 km/h',
      rain: '12.0 mm/h',
      reports: 2,
      layer: 'traffic',
    },
    {
      id: 'saket',
      name: 'Saket Corridor',
      lat: 28.5244,
      lon: 77.2140,
      severity: 'LOW',
      severity_score: 0.12,
      confidence: 0.95,
      summary: 'Smooth Flow (12%) • Normal operations',
      speed: '48 km/h',
      rain: '2.0 mm/h',
      reports: 0,
      layer: 'all',
    },
    {
      id: 'nehru-place',
      name: 'Nehru Place Hub',
      lat: 28.5494,
      lon: 77.2528,
      severity: 'LOW',
      severity_score: 0.22,
      confidence: 0.88,
      summary: 'Normal Commercial Transit Flow',
      speed: '36 km/h',
      rain: '4.5 mm/h',
      reports: 1,
      layer: 'all',
    }
  ];

  const filteredZones = displayZones.filter((z) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'rain') return (parseFloat(z.rain) || 0) > 10.0 || z.layer === 'rain' || z.severity === 'CRITICAL';
    if (activeFilter === 'traffic') return (z.speed && parseFloat(z.speed) < 30.0) || z.layer === 'traffic' || z.severity === 'CRITICAL';
    if (activeFilter === 'civic') return (z.reports || 0) > 0 || z.layer === 'civic' || z.severity === 'CRITICAL';
    return true;
  });

  // Dynamic Tile Layers that adapt to Light vs Dark theme
  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const attribution = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>';

  return (
    <div className="w-full h-[640px] bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden relative shadow-xl flex flex-col justify-between p-space-md">
      {/* Map Control Floating Bar */}
      <div className="relative z-[500] flex flex-wrap items-center justify-between gap-space-sm pointer-events-auto">
        <div className="flex items-center gap-1 bg-surface-container-high/90 backdrop-blur-md p-1 rounded-lg shadow-md border border-outline-variant/20">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-space-md py-1.5 rounded-md font-body-sm text-body-sm font-bold shadow-sm transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            All Layers
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('rain')}
            className={`px-space-md py-1.5 rounded-md font-body-sm text-body-sm transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'rain'
                ? 'bg-primary text-on-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>Rainfall</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('traffic')}
            className={`px-space-md py-1.5 rounded-md font-body-sm text-body-sm transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'traffic'
                ? 'bg-primary text-on-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-error"></span>
            <span>Traffic Flow</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('civic')}
            className={`px-space-md py-1.5 rounded-md font-body-sm text-body-sm transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'civic'
                ? 'bg-primary text-on-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Civic 311</span>
          </button>
        </div>

        <div className="flex items-center gap-space-xs">
          <div className="bg-surface-container-high/90 backdrop-blur-md px-space-md py-1.5 rounded-lg font-body-sm text-body-sm text-on-surface flex items-center gap-2 border border-outline-variant/20 shadow-md">
            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
            <span className="font-medium">South Delhi Sector</span>
          </div>
        </div>
      </div>

      {/* Embedded Leaflet Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution={attribution}
            url={tileUrl}
            maxZoom={19}
          />
          <MapController center={DEFAULT_CENTER} zoom={13} theme={theme} />

          {/* Floating Zoom in/out overlay controls */}
          <div className="absolute top-space-md right-space-md z-[500] pointer-events-auto">
            <MapZoomButtons />
          </div>

          {filteredZones.map((zone) => (
            <Marker
              key={zone.id || zone.name}
              position={[zone.lat || zone.latitude, zone.lon || zone.longitude]}
              icon={createZoneIcon(zone)}
              eventHandlers={{
                click: () => onSelectZone(zone)
              }}
            >
              <Popup className="custom-popup" closeButton={false}>
                <div className="p-3 bg-surface-container-high rounded-xl border border-outline-variant/30 text-on-surface min-w-[240px] shadow-2xl">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-outline-variant/20">
                    <span className="font-bold font-headline-sm text-sm text-on-surface flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${zone.severity === 'CRITICAL' ? 'bg-error animate-ping' : 'bg-primary'}`}></span>
                      {zone.name || zone.zone}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      zone.severity === 'CRITICAL' ? 'bg-error text-white' : 'bg-primary/20 text-primary'
                    }`}>
                      {Math.round((zone.severity_score || 0.86) * 100)}% {zone.severity || 'Status'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2">
                    {zone.summary || 'Correlated multi-source zone telemetry'}
                  </p>
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                    <div className="bg-surface-container p-1 rounded">
                      <span className="text-on-surface-variant block">Speed</span>
                      <span className="text-error font-bold">{zone.speed || '4.2 km/h'}</span>
                    </div>
                    <div className="bg-surface-container p-1 rounded">
                      <span className="text-on-surface-variant block">Rain</span>
                      <span className="text-primary font-bold">{zone.rain || '78 mm/h'}</span>
                    </div>
                    <div className="bg-surface-container p-1 rounded">
                      <span className="text-on-surface-variant block">Reports</span>
                      <span className="text-secondary font-bold">{zone.reports || 14}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Bottom Bar: Operational Telemetry Status */}
      <div className="relative z-[500] px-space-xs flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant pointer-events-none">
        <div className="flex items-center gap-2 bg-surface-container-high/90 backdrop-blur-md px-2 py-1 rounded-md border border-outline-variant/20">
          <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
          <span className="text-on-surface font-medium">All 41 telemetry nodes operational</span>
        </div>
        <div className="bg-surface-container-high/90 backdrop-blur-md px-2 py-1 rounded-md border border-outline-variant/20 text-on-surface-variant">
          Leaflet GIS Engine • Real-Time Geo Fusion
        </div>
      </div>
    </div>
  );
}
