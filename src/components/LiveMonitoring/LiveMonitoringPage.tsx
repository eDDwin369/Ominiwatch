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
  Info
} from 'lucide-react';
import { Card } from '../shared/Card';
import { PageHeader } from '../shared/PageHeader';
import { Badge } from '../shared/Badge';
import { SearchField } from '../shared/SearchField';
import { CustomSmoothDropdown } from '../shared/CustomSmoothDropdown';
import { Modal } from '../shared/Modal';
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
    hasStream: false,
    streamText: 'No 360° stream',
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
    hasStream: false,
    streamText: 'No 360° stream',
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
    hasStream: false,
    streamText: 'No 360° stream',
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
    hasStream: false,
    streamText: 'No 360° stream',
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
    hasStream: false,
    streamText: 'No 360° stream',
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
    hasStream: false,
    streamText: 'No 360° stream',
    resolution: '1080p FHD',
    fps: 30,
    description: 'Aisle B3 high-bay pallet racking and forklift operations surveillance.'
  }
];

export type AlertPriorityId = 'critical' | 'high' | 'medium' | 'low';

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

  // Version 1 (Sidebar) States
  const [isAlertSidebarOpen, setIsAlertSidebarOpen] = useState(false);
  const [v1SelectedPriority, setV1SelectedPriority] = useState<AlertPriorityId>('critical');
  const [v1SelectedAlertTypeId, setV1SelectedAlertTypeId] = useState<string | null>(null);

  // Version 2 (Horizontal Interface) States
  const [v2SelectedPriority, setV2SelectedPriority] = useState<AlertPriorityId>('critical');
  const [v2IsCategoryRowVisible, setV2IsCategoryRowVisible] = useState(false);
  const [v2SelectedCategory, setV2SelectedCategory] = useState<string | null>(null); // 'all-priority' | alertTypeId | null

  // Live Stream Viewport Modal State
  const [selectedCameraForModal, setSelectedCameraForModal] = useState<LiveCameraItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [projectionMode, setProjectionMode] = useState<'flat' | '360'>('360');
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState<boolean>(false);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 50, y: 78 });
  const [ptzCoords, setPtzCoords] = useState<{ pan: number; tilt: number }>({ pan: 0, tilt: 0 });
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [isSubStream, setIsSubStream] = useState<boolean>(false);

  // Total alert count
  const totalAlertCount = useMemo(() => {
    return PRIORITY_CATEGORIES.reduce((acc, cat) => acc + cat.count, 0);
  }, []);

  // V1 active priority category
  const v1ActivePriorityCategory = useMemo(() => {
    return PRIORITY_CATEGORIES.find(c => c.id === v1SelectedPriority) || PRIORITY_CATEGORIES[0];
  }, [v1SelectedPriority]);

  // V2 active priority category
  const v2ActivePriorityCategory = useMemo(() => {
    return PRIORITY_CATEGORIES.find(c => c.id === v2SelectedPriority) || PRIORITY_CATEGORIES[0];
  }, [v2SelectedPriority]);

  // V1 active selected alert type object
  const v1ActiveSelectedAlertType = useMemo(() => {
    if (!v1SelectedAlertTypeId) return null;
    for (const cat of PRIORITY_CATEGORIES) {
      const found = cat.alertTypes.find(t => t.id === v1SelectedAlertTypeId);
      if (found) return { ...found, category: cat };
    }
    return null;
  }, [v1SelectedAlertTypeId]);

  // V2 active selected alert item
  const v2ActiveSelectedAlertItem = useMemo(() => {
    if (!v2SelectedCategory) return null;
    if (v2SelectedCategory === 'all-priority') {
      return {
        id: 'all-priority',
        name: `All ${v2ActivePriorityCategory.label.toLowerCase()}`,
        count: v2ActivePriorityCategory.count,
        category: v2ActivePriorityCategory,
        cameraIds: Array.from(new Set(v2ActivePriorityCategory.alertTypes.flatMap(t => t.cameraIds)))
      };
    }
    const found = v2ActivePriorityCategory.alertTypes.find(t => t.id === v2SelectedCategory);
    if (found) return { ...found, category: v2ActivePriorityCategory };
    return null;
  }, [v2SelectedCategory, v2ActivePriorityCategory]);

  // Close sidebar on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAlertSidebarOpen) setIsAlertSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAlertSidebarOpen]);

  // V1: Open sidebar with critical selected by default
  const handleOpenV1Sidebar = () => {
    if (!v1SelectedAlertTypeId) {
      setV1SelectedPriority('critical');
    }
    setIsAlertSidebarOpen(true);
  };

  // V1: Click on alert type row
  const handleToggleV1AlertType = (alertItem: AlertTypeItem, categoryId: AlertPriorityId) => {
    if (v1SelectedAlertTypeId === alertItem.id) {
      setV1SelectedAlertTypeId(null);
    } else {
      setV1SelectedAlertTypeId(alertItem.id);
      setV1SelectedPriority(categoryId);
    }
  };

  // V2: Click on horizontal priority item
  const handleSelectV2Priority = (priorityId: AlertPriorityId) => {
    setV2SelectedPriority(priorityId);
    setV2IsCategoryRowVisible(true);
    // Reset category selection on priority change to "all-priority" as shown in reference image
    setV2SelectedCategory('all-priority');
  };

  // V2: Click on category pill
  const handleSelectV2CategoryPill = (categoryId: string) => {
    if (v2SelectedCategory === categoryId) {
      // Toggle off to null
      setV2SelectedCategory(null);
    } else {
      setV2SelectedCategory(categoryId);
    }
  };

  // V2: Click "< All priorities"
  const handleV2ResetToAllPriorities = () => {
    setV2SelectedCategory(null);
    setV2IsCategoryRowVisible(false);
  };

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

  // Filter cameras based on search, dropdowns, AND active alert filter (V1 or V2)
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      // 1. Alert filter check
      if (uiVersion === 'v1') {
        if (v1ActiveSelectedAlertType) {
          if (!v1ActiveSelectedAlertType.cameraIds.includes(cam.id)) return false;
        }
      } else {
        // Version 2
        if (v2ActiveSelectedAlertItem) {
          if (!v2ActiveSelectedAlertItem.cameraIds.includes(cam.id)) return false;
        }
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
  }, [cameras, uiVersion, v1ActiveSelectedAlertType, v2ActiveSelectedAlertItem, searchQuery, cameraFilter, zoneFilter, timeFilter]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setCameraFilter('all');
    setZoneFilter('all');
    setTimeFilter('all');
    setV1SelectedAlertTypeId(null);
    setV2SelectedCategory(null);
    setV2IsCategoryRowVisible(false);
  };

  // Helper for priority icons
  const renderPriorityIcon = (id: AlertPriorityId, size = 18) => {
    switch (id) {
      case 'critical':
        return <Flame size={size} />;
      case 'high':
        return <AlertTriangle size={size} />;
      case 'medium':
        return <AlertCircle size={size} />;
      case 'low':
        return <CheckCircle2 size={size} />;
    }
  };

  return (
    <div className="figma-account-settings-page-wrapper" style={{ paddingBottom: '32px' }}>
      <div className="figma-account-settings-container">
        
        {/* Page Header */}
        <PageHeader 
          title="Live Monitoring" 
          subtitle="Real-time multi-channel optical feeds and camera monitoring"
          icon={<Radio size={20} />}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Version 1 Trigger Button (Preserved completely) */}
              {uiVersion === 'v1' && (
                <button
                  type="button"
                  className="live-alert-trigger-btn"
                  onClick={handleOpenV1Sidebar}
                  title="Open Active Alerts Panel"
                  aria-label="Active Alerts"
                >
                  <div className="live-alert-bell-wrapper">
                    <Bell size={16} />
                    <span className="live-alert-pulse-dot" />
                  </div>
                  <span className="live-alert-badge-count">{totalAlertCount}</span>
                  <span className="live-alert-btn-text">Active Alerts</span>
                </button>
              )}

              <Badge variant="success">All Feeds Online</Badge>
            </div>
          }
        />

        {/* VERSION 2: HORIZONTAL ALERT INTERFACE (Matching Reference Screenshot) */}
        {uiVersion === 'v2' && (
          <div className="live-v2-horizontal-card">
            {/* Top Row: Priority Summary */}
            <div className="live-v2-priority-row">
              {PRIORITY_CATEGORIES.map((cat) => {
                const isSelected = v2SelectedPriority === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`live-v2-priority-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectV2Priority(cat.id)}
                    style={{
                      borderColor: isSelected ? cat.borderColor : 'transparent',
                      backgroundColor: isSelected ? cat.bgColor : undefined
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSelectV2Priority(cat.id);
                    }}
                  >
                    <div className="live-v2-priority-left">
                      <span className="live-v2-priority-dot" style={{ backgroundColor: cat.color }} />
                      <span 
                        className="live-v2-priority-label"
                        style={{ color: isSelected ? cat.color : 'var(--text-main)' }}
                      >
                        {cat.label}
                      </span>
                    </div>

                    <div className="live-v2-priority-right">
                      {cat.newCount && (
                        <span 
                          className="live-v2-new-badge"
                          style={{
                            backgroundColor: cat.id === 'critical' ? cat.color : colorMix(cat.color, 16),
                            color: cat.id === 'critical' ? '#ffffff' : cat.color
                          }}
                        >
                          {cat.newCount} NEW
                        </span>
                      )}
                      <span className="live-v2-priority-count">
                        {cat.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Row: Expandable Alert Category Row (revealed on priority click) */}
            {v2IsCategoryRowVisible && (
              <div className="live-v2-category-row">
                {/* Back to All Priorities */}
                <button
                  type="button"
                  className="live-v2-all-priorities-btn"
                  onClick={handleV2ResetToAllPriorities}
                  title="Clear alert category filter"
                >
                  <ChevronLeft size={14} />
                  <span>All priorities</span>
                </button>

                <div className="live-v2-divider" />

                {/* All [Selected Priority] Pill */}
                <button
                  type="button"
                  className={`live-v2-category-pill ${v2SelectedCategory === 'all-priority' ? 'selected' : ''}`}
                  onClick={() => handleSelectV2CategoryPill('all-priority')}
                  style={{
                    backgroundColor: v2SelectedCategory === 'all-priority' ? v2ActivePriorityCategory.color : undefined,
                    borderColor: v2SelectedCategory === 'all-priority' ? v2ActivePriorityCategory.borderColor : undefined
                  }}
                >
                  <span>All {v2ActivePriorityCategory.label.toLowerCase()}</span>
                  <span className="live-v2-category-pill-count">{v2ActivePriorityCategory.count}</span>
                </button>

                {/* Category Pills for Selected Priority */}
                {v2ActivePriorityCategory.alertTypes.map((alertItem) => {
                  const isPillSelected = v2SelectedCategory === alertItem.id;
                  return (
                    <button
                      key={alertItem.id}
                      type="button"
                      className={`live-v2-category-pill ${isPillSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectV2CategoryPill(alertItem.id)}
                      style={{
                        backgroundColor: isPillSelected ? v2ActivePriorityCategory.color : undefined,
                        borderColor: isPillSelected ? v2ActivePriorityCategory.borderColor : undefined
                      }}
                      title={`Filter cameras by ${alertItem.name}`}
                    >
                      <span>{alertItem.name}</span>
                      <span className="live-v2-category-pill-count">{alertItem.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SINGLE COMPACT, WELL-ALIGNED TOOLBAR */}
        <div 
          className="vision-toolbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px'
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

            {/* Active Alert Filter Chip for V1 */}
            {uiVersion === 'v1' && v1ActiveSelectedAlertType && (
              <div 
                className="live-active-filter-chip"
                style={{
                  borderColor: v1ActiveSelectedAlertType.category.color,
                  backgroundColor: v1ActiveSelectedAlertType.category.bgColor
                }}
              >
                <span 
                  className="live-active-filter-dot" 
                  style={{ backgroundColor: v1ActiveSelectedAlertType.category.color }} 
                />
                <span style={{ fontSize: '12.5px' }}>
                  Alert: <strong>{v1ActiveSelectedAlertType.name}</strong> ({filteredCameras.length} {filteredCameras.length === 1 ? 'Camera' : 'Cameras'})
                </span>
                <button
                  type="button"
                  className="live-active-filter-clear"
                  onClick={() => setV1SelectedAlertTypeId(null)}
                  title="Clear alert filter"
                  aria-label="Clear alert filter"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Active Alert Filter Chip for V2 */}
            {uiVersion === 'v2' && v2ActiveSelectedAlertItem && (
              <div 
                className="live-active-filter-chip"
                style={{
                  borderColor: v2ActiveSelectedAlertItem.category.color,
                  backgroundColor: v2ActiveSelectedAlertItem.category.bgColor
                }}
              >
                <span 
                  className="live-active-filter-dot" 
                  style={{ backgroundColor: v2ActiveSelectedAlertItem.category.color }} 
                />
                <span style={{ fontSize: '12.5px' }}>
                  Alert: <strong>{v2ActiveSelectedAlertItem.name}</strong> ({filteredCameras.length} {filteredCameras.length === 1 ? 'Camera' : 'Cameras'})
                </span>
                <button
                  type="button"
                  className="live-active-filter-clear"
                  onClick={() => setV2SelectedCategory(null)}
                  title="Clear alert filter"
                  aria-label="Clear alert filter"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONTENT AREA: GRID VIEW OR LIST (TABLE) VIEW */}
        {filteredCameras.length > 0 ? (
          viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="camera-grid">
              {filteredCameras.map((cam) => (
                <Card 
                  key={cam.id} 
                  className="camera-card"
                  onClick={() => setSelectedCameraForModal(cam)}
                >
                  {/* Camera Preview Box */}
                  <div className={`camera-preview-box ${cam.hasStream ? 'is-live' : 'is-offline'}`}>
                    <div className="camera-preview-overlay" />

                    {/* Stream Live Badge */}
                    <div className={`camera-stream-badge ${cam.hasStream ? 'live' : 'offline'}`}>
                      <span className="camera-stream-dot" />
                      <span>{cam.hasStream ? 'LIVE' : 'OFFLINE'}</span>
                    </div>

                    {/* Camera Profile Badge */}
                    <div className="camera-type-badge">
                      {cam.type}
                    </div>

                    {/* Center Optical Placeholder */}
                    {cam.hasStream ? (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 1
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                          border: '1.5px solid var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                          boxShadow: '0 0 16px color-mix(in srgb, var(--primary) 25%, transparent)'
                        }}>
                          <Video size={20} style={{ color: 'var(--primary)' }} />
                        </div>
                        <span style={{ fontSize: '11.5px', color: 'color-mix(in srgb, var(--primary) 85%, white)', fontWeight: 600, letterSpacing: '0.3px' }}>
                          {cam.resolution} • {cam.fps} FPS
                        </span>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        color: 'var(--text-muted)',
                        zIndex: 1
                      }}>
                        <Camera size={34} style={{ opacity: 0.35, strokeWidth: 1.5 }} />
                        <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.2px' }}>
                          {cam.streamText || 'No 360° stream'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Info Details */}
                  <div className="camera-card-info">
                    <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                      <div className="camera-name-text" title={cam.name}>
                        {cam.name}
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
              ))}
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
                  {filteredCameras.map((cam) => (
                    <tr 
                      key={cam.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedCameraForModal(cam)}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: cam.hasStream ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: cam.hasStream ? 'var(--primary)' : 'var(--text-muted)',
                            flexShrink: 0
                          }}>
                            <Video size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13.5px' }}>{cam.name}</div>
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
                  ))}
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

        {/* VERSION 1: ALERT SIDEBAR OVERLAY (Preserved completely) */}
        {uiVersion === 'v1' && (
          <>
            <div 
              className={`live-alert-backdrop ${isAlertSidebarOpen ? 'open' : ''}`}
              onClick={() => setIsAlertSidebarOpen(false)}
              aria-hidden={!isAlertSidebarOpen}
            />

            <aside 
              className={`live-alert-sidebar ${isAlertSidebarOpen ? 'open' : ''}`}
              aria-label="Active Alerts Panel"
            >
              {/* Sidebar Header */}
              <div className="live-alert-sidebar-header">
                <div className="live-alert-sidebar-title-group">
                  <h3 className="live-alert-sidebar-title">Active Alerts</h3>
                  <span className="live-alert-sidebar-subtitle">
                    {totalAlertCount} real-time optical alerts logged
                  </span>
                </div>
                <button
                  type="button"
                  className="live-alert-close-btn"
                  onClick={() => setIsAlertSidebarOpen(false)}
                  title="Close alerts panel"
                  aria-label="Close alerts panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sidebar Scrollable Body */}
              <div className="live-alert-sidebar-body">
                
                {/* Priority Categories */}
                <div>
                  <div className="live-alert-section-header" style={{ marginBottom: '10px' }}>
                    <span className="live-alert-section-title">Priority Categories</span>
                  </div>

                  <div className="live-priority-grid">
                    {PRIORITY_CATEGORIES.map((cat) => {
                      const isSelected = v1SelectedPriority === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`live-priority-card ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setV1SelectedPriority(cat.id);
                            if (v1ActiveSelectedAlertType && v1ActiveSelectedAlertType.category.id !== cat.id) {
                              setV1SelectedAlertTypeId(null);
                            }
                          }}
                          style={{
                            borderColor: isSelected ? cat.borderColor : 'var(--border-light)',
                            backgroundColor: isSelected ? cat.bgColor : undefined
                          }}
                        >
                          <div className="live-priority-card-top">
                            <div 
                              className="live-priority-icon-pill"
                              style={{
                                backgroundColor: colorMix(cat.color, 15),
                                color: cat.color
                              }}
                            >
                              {renderPriorityIcon(cat.id, 16)}
                            </div>
                            <span className="live-priority-count" style={{ color: cat.color }}>
                              {cat.count}
                            </span>
                          </div>
                          <span className="live-priority-label" style={{ color: isSelected ? cat.color : 'var(--text-main)' }}>
                            {cat.label} Priority
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Priority Visual Connection & Hero Banner */}
                <div 
                  className="live-priority-banner"
                  style={{
                    borderColor: v1ActivePriorityCategory.borderColor,
                    backgroundColor: v1ActivePriorityCategory.bgColor
                  }}
                >
                  <div 
                    className="live-prominent-icon-container"
                    style={{
                      backgroundColor: v1ActivePriorityCategory.color,
                      boxShadow: `0 0 16px 2px ${v1ActivePriorityCategory.color}50`
                    }}
                  >
                    {renderPriorityIcon(v1ActivePriorityCategory.id, 24)}
                  </div>
                  <div className="live-priority-banner-info">
                    <div className="live-priority-banner-title">
                      {v1ActivePriorityCategory.label} Priority ({v1ActivePriorityCategory.count} Alerts)
                    </div>
                    <div className="live-priority-banner-sub">
                      Select an alert type below to filter relevant camera feeds
                    </div>
                  </div>
                </div>

                {/* Alert Category List for Selected Priority */}
                <div>
                  <div className="live-alert-section-header" style={{ marginBottom: '10px' }}>
                    <span className="live-alert-section-title">
                      {v1ActivePriorityCategory.label} Alert Types
                    </span>
                    {v1SelectedAlertTypeId && (
                      <button
                        type="button"
                        onClick={() => setV1SelectedAlertTypeId(null)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>

                  <div className="live-alert-types-list">
                    {v1ActivePriorityCategory.alertTypes.map((alertItem) => {
                      const isRowSelected = v1SelectedAlertTypeId === alertItem.id;
                      return (
                        <div
                          key={alertItem.id}
                          className={`live-alert-type-row ${isRowSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleV1AlertType(alertItem, v1ActivePriorityCategory.id)}
                          style={{
                            '--row-priority-color': v1ActivePriorityCategory.color
                          } as React.CSSProperties}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              handleToggleV1AlertType(alertItem, v1ActivePriorityCategory.id);
                            }
                          }}
                          title={`Click to filter cameras associated with ${alertItem.name}`}
                        >
                          <div className="live-alert-type-left">
                            <span 
                              className="live-alert-type-bullet"
                              style={{ backgroundColor: v1ActivePriorityCategory.color }}
                            />
                            <span className="live-alert-type-name">
                              {alertItem.name}
                            </span>
                          </div>

                          <div className="live-alert-type-right">
                            <span className="live-alert-type-count">
                              {alertItem.count}
                            </span>
                            {isRowSelected && (
                              <Check size={16} className="live-alert-check-icon" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Sidebar Footer */}
              <div className="live-alert-sidebar-footer">
                <span className="live-alert-footer-status">
                  {v1ActiveSelectedAlertType ? (
                    <>Filtering: <strong>{v1ActiveSelectedAlertType.name}</strong> ({filteredCameras.length} {filteredCameras.length === 1 ? 'cam' : 'cams'})</>
                  ) : (
                    <>Showing all {cameras.length} cameras</>
                  )}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {v1ActiveSelectedAlertType && (
                    <button
                      type="button"
                      className="figma-btn-cancel"
                      onClick={() => setV1SelectedAlertTypeId(null)}
                      style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                    >
                      Clear Filter
                    </button>
                  )}
                  <button
                    type="button"
                    className="figma-btn-primary"
                    onClick={() => setIsAlertSidebarOpen(false)}
                    style={{ height: '32px', padding: '0 14px', fontSize: '12px' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* COMPACT PILL SWITCHER: VERSION 1 / VERSION 2 (Section 1) */}
        <div className="live-version-switcher-container">
          <div className="live-version-switcher-pill" role="group" aria-label="Alert UI Version Switcher">
            <button
              type="button"
              className={`live-version-btn ${uiVersion === 'v1' ? 'active' : ''}`}
              onClick={() => setUiVersion('v1')}
              title="Switch to Version 1 (Right-side Alert Sidebar)"
            >
              <span>Version 1 (Alert Sidebar)</span>
            </button>
            <button
              type="button"
              className={`live-version-btn ${uiVersion === 'v2' ? 'active' : ''}`}
              onClick={() => setUiVersion('v2')}
              title="Switch to Version 2 (Horizontal Alert Interface)"
            >
              <span>Version 2 (Horizontal Interface)</span>
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
                          el.requestFullscreen?.().catch(() => {});
                        } else {
                          document.exitFullscreen?.().catch(() => {});
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

      </div>
    </div>
  );
}

// Utility helper for color mixing
function colorMix(hexColor: string, opacityPercent: number): string {
  return `${hexColor}${Math.round((opacityPercent / 100) * 255).toString(16).padStart(2, '0')}`;
}
