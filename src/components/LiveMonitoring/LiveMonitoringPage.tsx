import React, { useState, useMemo, useEffect } from 'react';
import {
  Radio,
  Video,
  Camera,
  LayoutGrid,
  LayoutList,
  Play,
  Pause,
  Maximize,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  Check,
  CheckCircle2,
  RotateCcw,
  Eye,
  X,
  Flame,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Info,
  User,
  ShieldCheck,
  ScanFace,
  ScanLine,
  Car
} from 'lucide-react';
import { Card } from '../shared/Card';
import { PageHeader } from '../shared/PageHeader';
import { Badge } from '../shared/Badge';
import { SearchField } from '../shared/SearchField';
import { CustomSmoothDropdown } from '../shared/CustomSmoothDropdown';
import { Modal } from '../shared/Modal';
import { RadialAlertDial, DIAL_USE_CASES, PRIORITY_CONFIG, AlertPriorityId, DEFAULT_PRIORITY_USE_CASE } from './RadialAlertDial';
import './LiveMonitoringPage.css';
import '../AccountSettings/AccountSettings.css';
import '../shared/SharedUI.css';

export interface LiveCameraItem {
  id: string;
  name: string;
  type: '360°' | 'PTZ' | 'Fixed';
  location: 'Indoor' | 'Outdoor';
  zone: string;
  hasStream: boolean;
  streamText?: string;
  resolution: string;
  fps: number;
  description?: string;
  rtspUrl?: string;
  feedUrl?: string;
  defaultPan?: number;
  defaultTilt?: number;
  zoomLevel?: string;
}

const INITIAL_LIVE_CAMERAS: LiveCameraItem[] = [
  {
    id: 'cam-1',
    name: 'Cafeteria Counter',
    type: 'Fixed',
    location: 'Indoor',
    zone: 'Cafeteria & Dining',
    hasStream: true,
    feedUrl: '/assets/frames/frame_0012.jpg',
    resolution: '1080p FHD',
    fps: 30,
    description: 'Indoor coverage of the cafeteria checkout counter and staff transit line.'
  },
  {
    id: 'cam-2',
    name: 'Chennai Rooftop 360',
    type: '360°',
    location: 'Outdoor',
    zone: 'Rooftop Perimeter',
    hasStream: true,
    feedUrl: '/images/chennai-rooftop-360.png',
    resolution: '4K UHD',
    fps: 30,
    description: 'High-altitude panoramic optical surveillance covering the entire building perimeter.',
    rtspUrl: 'rtsp://allcad-chennai.selfip.com:8554/RTMP_CAM23',
    defaultPan: 0,
    defaultTilt: 0,
    zoomLevel: '1x Optical'
  },
  {
    id: 'cam-3',
    name: 'Loading Dock',
    type: 'Fixed',
    location: 'Outdoor',
    zone: 'Logistics Bay North',
    hasStream: true,
    feedUrl: '/assets/frames/frame_0036.jpg',
    resolution: '1080p FHD',
    fps: 30,
    description: 'Exterior logistics entrance and pallet offloading platform monitoring.'
  },
  {
    id: 'cam-4',
    name: 'Main Gate PTZ',
    type: 'PTZ',
    location: 'Outdoor',
    zone: 'Main Entrance Gate',
    hasStream: true,
    feedUrl: '/assets/frames/frame_0060.jpg',
    resolution: '4K UHD',
    fps: 60,
    description: 'Primary vehicular entry and security turnstile pan-tilt tracking node.'
  },
  {
    id: 'cam-5',
    name: 'Perimeter East',
    type: 'Fixed',
    location: 'Outdoor',
    zone: 'East Boundary Fence',
    hasStream: true,
    feedUrl: '/assets/frames/frame_0084.jpg',
    resolution: '1080p FHD',
    fps: 30,
    description: 'Eastern facility boundary surveillance fence and intrusion monitoring.'
  },
  {
    id: 'cam-6',
    name: 'Server Room',
    type: 'Fixed',
    location: 'Indoor',
    zone: 'Data Center Vault',
    hasStream: true,
    feedUrl: '/assets/frames/frame_0108.jpg',
    resolution: '4K UHD',
    fps: 60,
    description: 'High-security data center and server vault biometric entrance.'
  },
  {
    id: 'cam-7',
    name: 'Street PTZ',
    type: 'PTZ',
    location: 'Outdoor',
    zone: 'West Crossroad',
    hasStream: true,
    feedUrl: '/assets/frames/frame_0024.jpg',
    resolution: '4K UHD',
    fps: 30,
    description: 'Street-facing PTZ camera with active highway license plate optical tracking.'
  },
  {
    id: 'cam-8',
    name: 'Warehouse Aisle',
    type: 'Fixed',
    location: 'Indoor',
    zone: 'Central Warehouse',
    hasStream: true,
    feedUrl: '/assets/frames/frame_0072.jpg',
    resolution: '1080p FHD',
    fps: 30,
    description: 'Aisle B3 high-bay pallet racking and forklift operations surveillance.'
  }
];


export interface AlertTypeItem {
  id: string;
  name: string;
  count: number;
  cameraIds: string[];
}

export interface PriorityCategory {
  id: AlertPriorityId;
  label: string;
  count: number;
  newCount?: number;
  color: string;
  darkColor: string;
  bgColor: string;
  borderColor: string;
  alertTypes: AlertTypeItem[];
}

const PRIORITY_CATEGORIES: PriorityCategory[] = [
  {
    id: 'critical',
    label: 'Critical',
    count: 24,
    newCount: 3,
    color: '#991b1b', // Dark Red
    darkColor: '#7f1d1d',
    bgColor: 'rgba(153, 27, 27, 0.08)',
    borderColor: '#991b1b',
    alertTypes: [
      { id: 'crit-1', name: 'Person Detection', count: 10, cameraIds: ['cam-1', 'cam-6', 'cam-8'] },
      { id: 'crit-2', name: 'Smoke Detection', count: 8, cameraIds: ['cam-6', 'cam-8'] },
      { id: 'crit-3', name: 'Fire Detection', count: 6, cameraIds: ['cam-3', 'cam-6'] }
    ]
  },
  {
    id: 'high',
    label: 'High',
    count: 16,
    newCount: 1,
    color: '#ea580c', // Red-Orange (v2 spec)
    darkColor: '#c2410c',
    bgColor: 'rgba(234, 88, 12, 0.08)',
    borderColor: '#ea580c',
    alertTypes: [
      { id: 'high-1', name: 'Intrusion Detection', count: 7, cameraIds: ['cam-2', 'cam-5'] },
      { id: 'high-2', name: 'Unregistered Vehicle', count: 5, cameraIds: ['cam-4', 'cam-7'] },
      { id: 'high-3', name: 'Perimeter Breach', count: 4, cameraIds: ['cam-2', 'cam-5'] }
    ]
  },
  {
    id: 'medium',
    label: 'Medium',
    count: 12,
    newCount: 1,
    color: '#d97706', // Amber (v2 spec)
    darkColor: '#b45309',
    bgColor: 'rgba(217, 119, 6, 0.08)',
    borderColor: '#d97706',
    alertTypes: [
      { id: 'med-1', name: 'PPE Compliance', count: 5, cameraIds: ['cam-3', 'cam-8'] },
      { id: 'med-2', name: 'Crowd Gathering', count: 4, cameraIds: ['cam-1', 'cam-4'] },
      { id: 'med-3', name: 'Vehicle Speeding', count: 3, cameraIds: ['cam-4', 'cam-7'] }
    ]
  },
  {
    id: 'low',
    label: 'Low',
    count: 8,
    color: '#2563eb', // Blue (v2 spec)
    darkColor: '#1d4ed8',
    bgColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: '#2563eb',
    alertTypes: [
      { id: 'low-1', name: 'Camera Obstruction', count: 3, cameraIds: ['cam-5'] },
      { id: 'low-2', name: 'Low Lighting Detected', count: 3, cameraIds: ['cam-2', 'cam-3'] },
      { id: 'low-3', name: 'Motion in Public Zone', count: 2, cameraIds: ['cam-1', 'cam-7'] }
    ]
  }
];

const CAMERA_FILTER_OPTIONS = [
  { label: 'All Cameras', value: 'all' },
  { label: 'Cafeteria Counter', value: 'Cafeteria Counter' },
  { label: 'Chennai Rooftop 360', value: 'Chennai Rooftop 360' },
  { label: 'Loading Dock', value: 'Loading Dock' },
  { label: 'Main Gate PTZ', value: 'Main Gate PTZ' },
  { label: 'Perimeter East', value: 'Perimeter East' },
  { label: 'Server Room', value: 'Server Room' },
  { label: 'Street PTZ', value: 'Street PTZ' },
  { label: 'Warehouse Aisle', value: 'Warehouse Aisle' }
];

const ZONE_FILTER_OPTIONS = [
  { label: 'All Zones', value: 'all' },
  { label: 'Cafeteria & Dining', value: 'Cafeteria & Dining' },
  { label: 'Central Warehouse', value: 'Central Warehouse' },
  { label: 'Data Center Vault', value: 'Data Center Vault' },
  { label: 'East Boundary Fence', value: 'East Boundary Fence' },
  { label: 'Logistics Bay North', value: 'Logistics Bay North' },
  { label: 'Main Entrance Gate', value: 'Main Entrance Gate' },
  { label: 'Rooftop Perimeter', value: 'Rooftop Perimeter' },
  { label: 'West Crossroad', value: 'West Crossroad' }
];

const TIME_FILTER_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Real-time Live', value: 'live' },
  { label: 'Past 1 Hour', value: '1h' },
  { label: 'Past 24 Hours', value: '24h' },
  { label: 'Past 7 Days', value: '7d' }
];

// Render prominent detection icon by usecase id
const renderDetectionIcon = (id: string, size = 28) => {
  switch (id) {
    case 'person':
      return <User size={size} strokeWidth={2.2} />;
    case 'fire-smoke':
      return <Flame size={size} strokeWidth={2.2} />;
    case 'ppe':
      return <ShieldCheck size={size} strokeWidth={2.2} />;
    case 'face':
      return <ScanFace size={size} strokeWidth={2.2} />;
    case 'anpr':
      return <ScanLine size={size} strokeWidth={2.2} />;
    case 'vehicle':
      return <Car size={size} strokeWidth={2.2} />;
    default:
      return <Flame size={size} strokeWidth={2.2} />;
  }
};

export interface LiveMonitoringPageProps {
  onNavigate?: (view: string, options?: any) => void;
}

export function LiveMonitoringPage({ onNavigate: _onNavigate }: LiveMonitoringPageProps = {}) {
  const [cameras] = useState<LiveCameraItem[]>(INITIAL_LIVE_CAMERAS);

  // UI Version Switcher: Version 1 (Sidebar) vs Version 2 (Horizontal)
  const [uiVersion, setUiVersion] = useState<'v1' | 'v2'>('v1');

  // Toolbar Filter States (Standard 5 controls)
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cameraFilter, setCameraFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  // Option Switcher (1, 2, 3) & Radial Alert Dial States
  const [alertUiOption, setAlertUiOption] = useState<1 | 2 | 3>(1);
  const [selectedPriority, setSelectedPriority] = useState<AlertPriorityId>('critical');
  // Default to 'fire-smoke' alert filter on initial load
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>('fire-smoke');

  // Handle priority change from center dial button (auto-selects default alert for that priority)
  const handlePriorityChange = (newPriority: AlertPriorityId) => {
    setSelectedPriority(newPriority);
    const defaultUseCase = DEFAULT_PRIORITY_USE_CASE[newPriority] || 'fire-smoke';
    setSelectedUseCaseId(defaultUseCase);
  };

  // Live Stream Viewport Modal State
  const [selectedCameraForModal, setSelectedCameraForModal] = useState<LiveCameraItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [projectionMode, setProjectionMode] = useState<'flat' | '360'>('360');
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState<boolean>(false);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 50, y: 78 });
  const [ptzCoords, setPtzCoords] = useState<{ pan: number; tilt: number }>({ pan: 0, tilt: 0 });
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [isSubStream, setIsSubStream] = useState<boolean>(false);

  // Active priority meta configuration
  const activePriorityMeta = useMemo(() => {
    return PRIORITY_CONFIG[selectedPriority] || PRIORITY_CONFIG.critical;
  }, [selectedPriority]);

  // Active selected detection use case item
  const activeSelectedUseCase = useMemo(() => {
    if (!selectedUseCaseId) return null;
    return DIAL_USE_CASES.find(u => u.id === selectedUseCaseId) || null;
  }, [selectedUseCaseId]);

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setTargetPos({ x: xPct, y: yPct });
    setPtzCoords({
      pan: Math.round((xPct - 50) * 3.6),
      tilt: Math.round((yPct - 50) * 1.8)
    });
  };

  // Filter cameras based on search, dropdowns, AND radial detection alert filter
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      // 1. Detection Use Case alert filter
      if (activeSelectedUseCase) {
        if (!activeSelectedUseCase.cameraIds.includes(cam.id)) return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cam.name.toLowerCase().includes(q);
        const matchesZone = cam.zone.toLowerCase().includes(q);
        const matchesLocation = cam.location.toLowerCase().includes(q);
        const matchesType = cam.type.toLowerCase().includes(q);
        if (!matchesName && !matchesZone && !matchesLocation && !matchesType) return false;
      }

      // 3. Camera dropdown
      if (cameraFilter !== 'all' && cam.name.toLowerCase() !== cameraFilter.toLowerCase()) {
        return false;
      }

      // 4. Zone dropdown
      if (zoneFilter !== 'all' && cam.zone.toLowerCase() !== zoneFilter.toLowerCase()) {
        return false;
      }

      // 5. Time dropdown
      if (timeFilter === 'live' && !cam.hasStream) {
        return false;
      }

      return true;
    });
  }, [cameras, activeSelectedUseCase, searchQuery, cameraFilter, zoneFilter, timeFilter]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setCameraFilter('all');
    setZoneFilter('all');
    setTimeFilter('all');
    setSelectedUseCaseId(null);
  };

  return (
    <div className="figma-account-settings-page-wrapper" style={{ paddingBottom: '32px' }}>
      <div className="figma-account-settings-container">

        {/* Page Header */}
        <PageHeader
          title="Live Monitoring"
          subtitle=""
          icon={<Radio size={20} />}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            </div>
          }
        />

        {/* TOOLBAR CONTROLS & INLINE RADIAL ALERT DIAL */}
        <div
          className="live-monitoring-top-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}
        >
          {/* Left: Toolbar Filters */}
          <div
            className="vision-toolbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              flex: 1,
              marginBottom: 0
            }}
          >
            <div className="vision-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* 1. Search Bar */}
              <SearchField
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search camera..."
              />

              {/* 2. Grid / List View Toggle */}
              <div className="vision-view-toggle" role="group" aria-label="View mode toggle">
                <button
                  type="button"
                  className={`vision-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={`vision-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                  aria-label="List View"
                >
                  <LayoutList size={16} />
                </button>
              </div>

              {/* 3. All Cameras Dropdown */}
              <div style={{ minWidth: '150px' }}>
                <CustomSmoothDropdown
                  label="All Cameras"
                  value={cameraFilter}
                  onChange={(val) => setCameraFilter(val)}
                  options={CAMERA_FILTER_OPTIONS}
                />
              </div>

              {/* 4. All Zones Dropdown */}
              <div style={{ minWidth: '150px' }}>
                <CustomSmoothDropdown
                  label="All Zones"
                  value={zoneFilter}
                  onChange={(val) => setZoneFilter(val)}
                  options={ZONE_FILTER_OPTIONS}
                />
              </div>

              {/* 5. All Time Dropdown */}
              <div style={{ minWidth: '135px' }}>
                <CustomSmoothDropdown
                  label="All Time"
                  value={timeFilter}
                  onChange={(val) => setTimeFilter(val)}
                  options={TIME_FILTER_OPTIONS}
                />
              </div>

              {/* Active Alert Filter Chip */}
              {activeSelectedUseCase && (
                <div
                  className="live-active-filter-chip"
                  style={{
                    borderColor: activePriorityMeta.color,
                    backgroundColor: activePriorityMeta.bgLight
                  }}
                >
                  <span
                    className="live-active-filter-dot"
                    style={{ backgroundColor: activePriorityMeta.color }}
                  />
                  <span style={{ fontSize: '12.5px' }}>
                    Alert: <strong>{activeSelectedUseCase.name}</strong> ({filteredCameras.length} {filteredCameras.length === 1 ? 'Camera' : 'Cameras'})
                  </span>
                  <button
                    type="button"
                    className="live-active-filter-clear"
                    onClick={() => setSelectedUseCaseId(null)}
                    title="Clear alert filter"
                    aria-label="Clear alert filter"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* BOTTOM OPTION SWITCHER PILL (1, 2, 3) */}
              <div className="live-option-switcher-container">
                <div className="live-option-switcher-pill" role="group" aria-label="Dial Design Options">
                  <button
                    type="button"
                    className={`live-option-btn ${alertUiOption === 1 ? 'active' : ''}`}
                    onClick={() => setAlertUiOption(1)}
                    title="Option 1: Ultra-compact native circular dial (~115px)"
                  >
                    <span>Option 1: Compact Dial (115px)</span>
                  </button>
                  <button
                    type="button"
                    className={`live-option-btn ${alertUiOption === 2 ? 'active' : ''}`}
                    onClick={() => setAlertUiOption(2)}
                    title="Option 2: Focus HUD (Expands on hover to 132px)"
                  >
                    <span>Option 2: Focus HUD (Hover-Expand)</span>
                  </button>
                  <button
                    type="button"
                    className={`live-option-btn ${alertUiOption === 3 ? 'active' : ''}`}
                    onClick={() => setAlertUiOption(3)}
                    title="Option 3: Horizontal Mini-Dial Capsule (~38px height)"
                  >
                    <span>Option 3: Horizontal Capsule</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Inline Radial Alert Dial (Variant 1, 2, or 3) */}
          <div className="live-monitoring-dial-wrapper">
            <RadialAlertDial
              variant={alertUiOption}
              selectedPriority={selectedPriority}
              onPriorityChange={handlePriorityChange}
              selectedUseCaseId={selectedUseCaseId}
              onSelectUseCase={(id) => setSelectedUseCaseId(id)}
            />
          </div>
        </div>

        {/* MAIN CONTENT AREA: GRID VIEW OR LIST (TABLE) VIEW */}
        {filteredCameras.length > 0 ? (
          viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="camera-grid">
              {filteredCameras.map((cam) => {
                const cameraUseCase = activeSelectedUseCase || DIAL_USE_CASES.find(u => u.cameraIds.includes(cam.id)) || DIAL_USE_CASES[1];
                return (
                  <Card
                    key={cam.id}
                    className={`camera-card priority-${selectedPriority}`}
                    onClick={() => setSelectedCameraForModal(cam)}
                  >
                    {/* Camera Preview Box */}
                    <div className="camera-preview-box is-live">
                      {/* Actual Dummy Camera Feed Image */}
                      <img 
                        src={cam.feedUrl || '/assets/frames/frame_0000.jpg'} 
                        alt={cam.name} 
                        className="camera-feed-image" 
                      />

                      {/* CCTV Edge Shading Overlay */}
                      <div className="camera-preview-overlay" />

                      {/* Top Bar HUD: Stream Live Badge & Detection Alert Chip & Type Badge */}
                      <div className="camera-preview-top-hud">
                        <div className="camera-stream-badge live">
                          <span className="camera-stream-dot" />
                          <span>LIVE</span>
                        </div>

                        {/* Detection Alert Badge (Corner-aligned, non-intrusive) */}
                        <div 
                          className="camera-feed-alert-chip"
                          style={{
                            backgroundColor: activePriorityMeta.color,
                            boxShadow: `0 2px 8px ${activePriorityMeta.glow}`
                          }}
                        >
                          {renderDetectionIcon(cameraUseCase.id, 13)}
                          <span>{cameraUseCase.name}</span>
                        </div>

                        {/* Camera Profile Badge */}
                        <div className="camera-type-badge">
                          {cam.type}
                        </div>
                      </div>

                      {/* Bottom Bar HUD (CCTV OSD: Camera ID & Live Specs) */}
                      <div className="camera-preview-bottom-hud">
                        <span className="camera-cctv-label">
                          {cam.id.toUpperCase()} // {cam.name.toUpperCase()}
                        </span>
                        <span className="camera-cctv-specs">
                          {cam.resolution} • {cam.fps} FPS
                        </span>
                      </div>
                    </div>

                    {/* Card Info Details */}
                    <div className="camera-card-info">
                      <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <div className="camera-name-text" title={cam.name}>
                            {cam.name}
                          </div>
                          <span 
                            className="camera-info-alert-tag"
                            style={{
                              backgroundColor: activePriorityMeta.bgLight,
                              borderColor: activePriorityMeta.color,
                              color: activePriorityMeta.color
                            }}
                          >
                            {renderDetectionIcon(cameraUseCase.id, 12)}
                            <span>{cameraUseCase.shortName}</span>
                          </span>
                        </div>
                        <div className="camera-sub-text">
                          <span>{cam.zone}</span>
                          <span>•</span>
                          <span>{cam.location}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="camera-menu-btn"
                        title="Inspect Live Stream"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCameraForModal(cam);
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* LIST (TABLE) VIEW */
            <div className="ai-table-container">
              <table className="ai-table">
                <thead>
                  <tr>
                    <th>Camera Name</th>
                    <th>Zone</th>
                    <th>Location & Type</th>
                    <th>Resolution & FPS</th>
                    <th>Status</th>
                    <th>Stream Protocol</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCameras.map((cam) => {
                    const cameraUseCase = activeSelectedUseCase || DIAL_USE_CASES.find(u => u.cameraIds.includes(cam.id)) || DIAL_USE_CASES[1];
                    return (
                      <tr
                        key={cam.id}
                        className={`priority-${selectedPriority}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedCameraForModal(cam)}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: activePriorityMeta.bgLight,
                              border: `1.5px solid ${activePriorityMeta.color}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: activePriorityMeta.color,
                              boxShadow: `0 0 10px ${activePriorityMeta.glow}`,
                              flexShrink: 0
                            }}>
                              {renderDetectionIcon(cameraUseCase.id, 18)}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13.5px' }}>{cam.name}</span>
                                <span 
                                  className="camera-info-alert-tag"
                                  style={{
                                    backgroundColor: activePriorityMeta.bgLight,
                                    borderColor: activePriorityMeta.color,
                                    color: activePriorityMeta.color,
                                    fontSize: '10px',
                                    padding: '1px 5px'
                                  }}
                                >
                                  {cameraUseCase.shortName}
                                </span>
                              </div>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>ID: {cam.id.toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                          {cam.zone}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'color-mix(in srgb, var(--text-main) 6%, transparent)',
                            color: 'var(--text-main)'
                          }}>
                            {cam.type}
                          </span>
                          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                            {cam.location}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {cam.resolution} • {cam.fps} FPS
                        </span>
                      </td>
                      <td>
                        <div className={`camera-stream-badge ${cam.hasStream ? 'live' : 'offline'}`} style={{ display: 'inline-flex' }}>
                          <span className="camera-stream-dot" />
                          <span>{cam.hasStream ? 'LIVE' : 'OFFLINE'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {cam.hasStream ? 'RTSP Live Stream' : 'Local Standby'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="camera-menu-btn"
                          title="View Live Stream"
                          onClick={() => setSelectedCameraForModal(cam)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500
                          }}
                        >
                          <Eye size={14} style={{ color: 'var(--primary)' }} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* EMPTY STATE */
          <Card style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--text-main) 6%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              marginBottom: '16px'
            }}>
              <Camera size={24} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              No cameras found
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '20px' }}>
              No cameras matched your search and filter criteria. Try adjusting your query or resetting all filters.
            </div>
            <button
              type="button"
              className="figma-btn-cancel"
              onClick={handleResetAllFilters}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>Reset All Filters</span>
            </button>
          </Card>
        )}

        {/* BOTTOM OPTION SWITCHER PILL (1, 2, 3) */}
        <div className="live-option-switcher-container">
          <div className="live-option-switcher-pill" role="group" aria-label="Dial Design Options">
            <button
              type="button"
              className={`live-option-btn ${alertUiOption === 1 ? 'active' : ''}`}
              onClick={() => setAlertUiOption(1)}
              title="Option 1: Ultra-compact native circular dial (~115px)"
            >
              <span>Option 1: Compact Dial (115px)</span>
            </button>
            <button
              type="button"
              className={`live-option-btn ${alertUiOption === 2 ? 'active' : ''}`}
              onClick={() => setAlertUiOption(2)}
              title="Option 2: Focus HUD (Expands on hover to 132px)"
            >
              <span>Option 2: Focus HUD (Hover-Expand)</span>
            </button>
            <button
              type="button"
              className={`live-option-btn ${alertUiOption === 3 ? 'active' : ''}`}
              onClick={() => setAlertUiOption(3)}
              title="Option 3: Horizontal Mini-Dial Capsule (~38px height)"
            >
              <span>Option 3: Horizontal Capsule</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE LIVE VIEWPORT STREAM MODAL */}
        {selectedCameraForModal && (
          <Modal
            isOpen={Boolean(selectedCameraForModal)}
            onClose={() => setSelectedCameraForModal(null)}
            title={selectedCameraForModal.name}
            maxWidth="940px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Modal Subheader Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'color-mix(in srgb, var(--text-main) 4%, transparent)',
                border: '1px solid var(--border-light)',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className={`camera-stream-badge ${selectedCameraForModal.hasStream ? 'live' : 'offline'}`} style={{ display: 'inline-flex' }}>
                    <span className="camera-stream-dot" />
                    <span>{selectedCameraForModal.hasStream ? 'LIVE STREAM' : 'STANDBY'}</span>
                  </div>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {selectedCameraForModal.resolution} • {selectedCameraForModal.fps} FPS
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Zone: {selectedCameraForModal.zone}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Flat / 360 Projection Toggle */}
                  <div className="vision-view-toggle" style={{ height: '32px', padding: '2px' }}>
                    <button
                      type="button"
                      className={`vision-view-btn ${projectionMode === '360' ? 'active' : ''}`}
                      onClick={() => setProjectionMode('360')}
                      style={{ width: '48px', height: '26px', fontSize: '11px', fontWeight: 600 }}
                    >
                      360°
                    </button>
                    <button
                      type="button"
                      className={`vision-view-btn ${projectionMode === 'flat' ? 'active' : ''}`}
                      onClick={() => setProjectionMode('flat')}
                      style={{ width: '48px', height: '26px', fontSize: '11px', fontWeight: 600 }}
                    >
                      Flat
                    </button>
                  </div>

                  {/* Sub-stream Toggle */}
                  <button
                    type="button"
                    className="figma-btn-cancel"
                    onClick={() => setIsSubStream(prev => !prev)}
                    style={{ height: '32px', padding: '0 10px', fontSize: '11.5px' }}
                  >
                    {isSubStream ? 'Sub-Stream' : 'Main Stream'}
                  </button>
                </div>
              </div>

              {/* Viewport Canvas Simulation */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  background: '#090d16',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'crosshair',
                  border: '1px solid var(--border-light)'
                }}
                onClick={handleViewportClick}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  pointerEvents: 'none'
                }} />

                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  pointerEvents: 'none'
                }} />

                {/* Target PTZ Reticle */}
                <div style={{
                  position: 'absolute',
                  top: `${targetPos.y}%`,
                  left: `${targetPos.x}%`,
                  width: '36px',
                  height: '36px',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  border: '1.5px solid #10b981',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                  pointerEvents: 'none',
                  transition: 'top 0.15s ease-out, left 0.15s ease-out'
                }}>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '4px', height: '4px', background: '#10b981', borderRadius: '50%' }} />
                </div>

                {/* Overlay Top Bar: Camera Selector & PTZ Coords */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 2,
                  pointerEvents: 'auto'
                }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCameraDropdownOpen(prev => !prev);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      <Camera size={13} style={{ color: '#10b981' }} />
                      <span>{selectedCameraForModal.name}</span>
                      <ChevronDown size={12} />
                    </button>

                    {isCameraDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          minWidth: '200px',
                          background: 'var(--bg-card, #ffffff)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                          padding: '4px',
                          zIndex: 10
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        {cameras.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCameraForModal(c);
                              setIsCameraDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '7px 10px',
                              border: 'none',
                              borderRadius: '4px',
                              background: c.id === selectedCameraForModal.id ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
                              color: c.id === selectedCameraForModal.id ? 'var(--primary)' : 'var(--text-main)',
                              fontSize: '12px',
                              fontWeight: c.id === selectedCameraForModal.id ? 600 : 400,
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <span>{c.name}</span>
                            {c.id === selectedCameraForModal.id && <Check size={13} />}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* BOTTOM OPTION SWITCHER PILL (1, 2, 3) */}
                    <div className="live-option-switcher-container">
                      <div className="live-option-switcher-pill" role="group" aria-label="Dial Design Options">
                        <button
                          type="button"
                          className={`live-option-btn ${alertUiOption === 1 ? 'active' : ''}`}
                          onClick={() => setAlertUiOption(1)}
                          title="Option 1: Ultra-compact native circular dial (~115px)"
                        >
                          <span>Option 1: Compact Dial (115px)</span>
                        </button>
                        <button
                          type="button"
                          className={`live-option-btn ${alertUiOption === 2 ? 'active' : ''}`}
                          onClick={() => setAlertUiOption(2)}
                          title="Option 2: Focus HUD (Expands on hover to 132px)"
                        >
                          <span>Option 2: Focus HUD (Hover-Expand)</span>
                        </button>
                        <button
                          type="button"
                          className={`live-option-btn ${alertUiOption === 3 ? 'active' : ''}`}
                          onClick={() => setAlertUiOption(3)}
                          title="Option 3: Horizontal Mini-Dial Capsule (~38px height)"
                        >
                          <span>Option 3: Horizontal Capsule</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PTZ Coordinates Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    color: '#94a3b8',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono, monospace)'
                  }}>
                    <span>Pan: {ptzCoords.pan}°</span>
                    <span>Tilt: {ptzCoords.tilt}°</span>
                    <span>Zoom: {selectedCameraForModal.zoomLevel || '1.0x'}</span>
                  </div>
                </div>

                {/* Viewport Bottom Controls Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  zIndex: 2,
                  pointerEvents: 'auto'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlaying(prev => !prev);
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title={isPlaying ? "Pause Stream" : "Play Stream"}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAlertActive(prev => !prev);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '0 10px',
                        height: '32px',
                        borderRadius: '6px',
                        border: isAlertActive ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: isAlertActive ? '#ef4444' : 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Bell size={13} />
                      <span>{isAlertActive ? 'Alert Raised' : 'Raise Alert'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono, monospace)' }}>
                      {selectedCameraForModal.rtspUrl || 'rtsp://192.168.1.101:554/live'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const el = e.currentTarget.closest('.modal-content') || document.documentElement;
                        if (!document.fullscreenElement) {
                          el.requestFullscreen?.().catch(() => { });
                        } else {
                          document.exitFullscreen?.().catch(() => { });
                        }
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Fullscreen"
                    >
                      <Maximize size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Click anywhere in the video area to pan/tilt camera focus to that coordinate.
                </span>
                <button
                  type="button"
                  className="figma-btn-primary"
                  onClick={() => setSelectedCameraForModal(null)}
                >
                  Close View
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* BOTTOM OPTION SWITCHER PILL (1, 2, 3) */}
        <div className="live-option-switcher-container">
          <div className="live-option-switcher-pill" role="group" aria-label="Dial Design Options">
            <button
              type="button"
              className={`live-option-btn ${alertUiOption === 1 ? 'active' : ''}`}
              onClick={() => setAlertUiOption(1)}
              title="Option 1: Ultra-compact native circular dial (~115px)"
            >
              <span>Option 1: Compact Dial (115px)</span>
            </button>
            <button
              type="button"
              className={`live-option-btn ${alertUiOption === 2 ? 'active' : ''}`}
              onClick={() => setAlertUiOption(2)}
              title="Option 2: Focus HUD (Expands on hover to 132px)"
            >
              <span>Option 2: Focus HUD (Hover-Expand)</span>
            </button>
            <button
              type="button"
              className={`live-option-btn ${alertUiOption === 3 ? 'active' : ''}`}
              onClick={() => setAlertUiOption(3)}
              title="Option 3: Horizontal Mini-Dial Capsule (~38px height)"
            >
              <span>Option 3: Horizontal Capsule</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Utility helper for color mixing
function colorMix(hexColor: string, opacityPercent: number): string {
  return `${hexColor}${Math.round((opacityPercent / 100) * 255).toString(16).padStart(2, '0')}`;
}
