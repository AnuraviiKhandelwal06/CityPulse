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
        <div class="absolute w-16 h-16 rounded-full bg-red-500/25 animate-ping"></div>
        <div class="absolute w-10 h-10 rounded-full bg-red-500/40 animate-pulse"></div>
        <div class="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg border-2 border-white text-white">
          <span class="material-symbols-outlined text-[16px]">priority_high</span>
        </div>
      </div>
    `;
  } else if (isHigh || isMedium) {
    html = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
        <div class="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center shadow-md border-2 border-white">
          <span class="w-2 h-2 rounded-full bg-slate-900"></span>
        </div>
      </div>
    `;
  } else {
    html = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
        <div class="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shadow-sm border border-white">
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
    <div className="flex items-center bg-surface-container-high/95 backdrop-blur-md rounded-xl overflow-hidden border border-outline-variant/30 shadow-md">
      <button
        className="p-2 hover:bg-surface-bright text-on-surface transition-colors cursor-pointer"
        type="button"
        onClick={() => map.zoomIn()}
        title="Zoom In"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>
      <div className="w-[1px] h-4 bg-outline-variant/30"></div>
      <button
        className="p-2 hover:bg-surface-bright text-on-surface transition-colors cursor-pointer"
        type="button"
        onClick={() => map.zoomOut()}
        title="Zoom Out"
      >
        <span className="material-symbols-outlined text-[18px]">remove</span>
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
      summary: 'Severe Congestion 88% • Heavy Rain 82.5mm/h • 19 Flooding Reports',
      speed: '4.2 km/h',
      rain: '82.5 mm/h',
      reports: 19,
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
      speed: '32 km/h',
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
      summary: 'Smooth Flow • Normal baseline',
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

  const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

  return (
    <div className="w-full h-[480px] md:h-[540px] bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden relative shadow-md flex flex-col justify-between p-4">
      {/* Top Floating Control Bar */}
      <div className="relative z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Simple Layer Controls: [All] [Rain] [Traffic] [Civic] */}
        <div className="flex items-center gap-1 bg-surface-container-high/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-outline-variant/25">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('rain')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'rain'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-medium'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>Rain</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('traffic')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'traffic'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-medium'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-error"></span>
            <span>Traffic</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('civic')}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'civic'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-medium'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Civic</span>
          </button>
        </div>

        {/* Location Tag */}
        <div className="hidden sm:flex items-center gap-1.5 bg-surface-container-high/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface border border-outline-variant/25 shadow-md">
          <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
          <span>Delhi NCR Urban Grid</span>
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
          <div className="absolute top-4 right-4 z-[500] pointer-events-auto">
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
                    <span className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${zone.severity === 'CRITICAL' ? 'bg-error animate-ping' : 'bg-primary'}`}></span>
                      {zone.name || zone.zone}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      zone.severity === 'CRITICAL' ? 'bg-error text-white' : 'bg-primary/20 text-primary'
                    }`}>
                      {zone.severity || 'Status'}
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
                      <span className="text-primary font-bold">{zone.rain || '82.5 mm/h'}</span>
                    </div>
                    <div className="bg-surface-container p-1 rounded">
                      <span className="text-on-surface-variant block">Reports</span>
                      <span className="text-secondary font-bold">{zone.reports || 19}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectZone(zone)}
                    className="w-full mt-2 py-1 px-2 rounded bg-primary text-on-primary text-[11px] font-bold hover:bg-primary/90 transition-colors text-center cursor-pointer"
                  >
                    Inspect Evidence &rarr;
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Bottom Bar: Operational Telemetry Status */}
      <div className="relative z-[500] px-1 flex items-center justify-between text-xs text-on-surface-variant pointer-events-none">
        <div className="flex items-center gap-1.5 bg-surface-container-high/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-outline-variant/25 shadow-sm">
          <span className="material-symbols-outlined text-[15px] text-tertiary">check_circle</span>
          <span className="text-on-surface font-medium">GIS Multi-Stream Telemetry Active</span>
        </div>
        <div className="hidden sm:block bg-surface-container-high/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-outline-variant/25 text-[11px] shadow-sm">
          OpenStreetMap &bull; Delhi Geo-Corridor Grid
        </div>
      </div>
    </div>
  );
}
