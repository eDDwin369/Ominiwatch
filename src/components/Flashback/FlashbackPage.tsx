import React, { useState, useMemo, useEffect } from 'react';
import { 
  History, 
  Video, 
  Camera, 
  Radio, 
  Settings, 
  Info, 
  Play, 
  Download, 
  AlertCircle, 
  Film, 
  Clock, 
  Trash2, 
  Eye, 
  MoreVertical 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '../shared/Card';
import { PageHeader } from '../shared/PageHeader';
import { Badge } from '../shared/Badge';
import { SearchField } from '../shared/SearchField';
import { CustomSmoothDropdown } from '../shared/CustomSmoothDropdown';
import { Modal } from '../shared/Modal';
import '../AccountSettings/AccountSettings.css';
import '../shared/SharedUI.css';

export interface CameraData {
  id: string;
  name: string;
  type: '360°' | 'PTZ' | 'Fixed';
  status: 'live' | 'offline';
  storage: 'Local SSD' | 'Cloud Vault' | 'Edge NVR';
  resolution: string;
  fps: number;
  location: string;
}

const DEFAULT_CAMERAS: CameraData[] = [
  {
    id: 'cam-01',
    name: 'Cafeteria Counter',
    type: 'Fixed',
    status: 'offline',
    storage: 'Local SSD',
    resolution: '1080p FHD',
    fps: 30,
    location: 'Building A - Ground Floor'
  },
  {
    id: 'cam-02',
    name: 'Chennai Rooftop 360',
    type: '360°',
    status: 'live',
    storage: 'Cloud Vault',
    resolution: '4K UHD',
    fps: 30,
    location: 'Tower East - Roof Observatory'
  },
  {
    id: 'cam-03',
    name: 'Loading Dock & Bay 4',
    type: 'Fixed',
    status: 'offline',
    storage: 'Edge NVR',
    resolution: '1080p FHD',
    fps: 30,
    location: 'Logistics Facility'
  },
  {
    id: 'cam-04',
    name: 'Main Gate PTZ',
    type: 'PTZ',
    status: 'live',
    storage: 'Cloud Vault',
    resolution: '4K UHD',
    fps: 60,
    location: 'Perimeter Entry Gate'
  },
  {
    id: 'cam-05',
    name: 'Perimeter East Fence',
    type: 'Fixed',
    status: 'live',
    storage: 'Edge NVR',
    resolution: '1080p FHD',
    fps: 30,
    location: 'East Perimeter Line'
  },
  {
    id: 'cam-06',
    name: 'Server Room Data Vault',
    type: 'Fixed',
    status: 'live',
    storage: 'Local SSD',
    resolution: '4K UHD',
    fps: 60,
    location: 'Building B - Secure Core'
  },
  {
    id: 'cam-07',
    name: 'Street West PTZ',
    type: 'PTZ',
    status: 'live',
    storage: 'Cloud Vault',
    resolution: '4K UHD',
    fps: 30,
    location: 'West Avenue Crossroad'
  },
  {
    id: 'cam-08',
    name: 'Warehouse Aisle B3',
    type: 'Fixed',
    status: 'offline',
    storage: 'Local SSD',
    resolution: '1080p FHD',
    fps: 30,
    location: 'Distribution Hub'
  }
];

const HISTORICAL_RECORDINGS = [
  { 
    id: 'rec-01', 
    title: 'CAM-01: Perimeter Gate Trigger Event', 
    cameraId: 'cam-04', 
    duration: '14m 20s', 
    time: '14:22:10 Today', 
    size: '420 MB', 
    eventType: 'Perimeter Alert' 
  },
  { 
    id: 'rec-02', 
    title: 'CAM-03: Server Room Access Event', 
    cameraId: 'cam-06', 
    duration: '08m 45s', 
    time: '11:05:42 Today', 
    size: '210 MB', 
    eventType: 'Door Access' 
  },
  { 
    id: 'rec-03', 
    title: 'CAM-02: Loading Bay Vehicle Detection', 
    cameraId: 'cam-03', 
    duration: '32m 10s', 
    time: '09:14:00 Today', 
    size: '1.1 GB', 
    eventType: 'Motion Detection' 
  },
  { 
    id: 'rec-04', 
    title: 'CAM-04: East Corridor Automated Patrol', 
    cameraId: 'cam-05', 
    duration: '45m 00s', 
    time: '04:00:15 Today', 
    size: '1.4 GB', 
    eventType: 'Patrol' 
  }
];

export function FlashbackPage() {
  // Navigation Tab: 'live' | 'history'
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  // Live Tab Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [storageFilter, setStorageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [gridLayout, setGridLayout] = useState<'1x1' | '2x2' | '3x3' | '4x4'>('3x3');

  // API State & Handling (Preserves real data fetching, handles error, offers fallback)
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Modals & Active Actions
  const [selectedCameraForStream, setSelectedCameraForStream] = useState<CameraData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<{ id: string; top: number; left: number } | null>(null);

  // History Tab Controls
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyTimeframe, setHistoryTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [historyEventType, setHistoryEventType] = useState('all');
  const [activeTimelineTime] = useState('14:22:10');

  // Camera data fetching function (corrects endpoint to /api/cameras instead of duplicate /api/api/cameras)
  const fetchCamerasFromApi = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Direct call to correct API endpoint
      const response = await fetch('/api/cameras');
      if (!response.ok) {
        throw new Error(`Cannot GET /api/cameras (HTTP ${response.status})`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCameras(data);
        setUseFallback(false);
      } else {
        // If empty data returned from server
        setCameras(DEFAULT_CAMERAS);
      }
    } catch (err: any) {
      setApiError(err?.message || 'Cannot GET /api/cameras');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCamerasFromApi();
  }, []);

  // Close action menus on outside click or scroll
  useEffect(() => {
    const handleClose = () => setActiveMenu(null);
    if (activeMenu) {
      document.addEventListener('click', handleClose);
      window.addEventListener('resize', handleClose);
      window.addEventListener('scroll', handleClose, true);
    }
    return () => {
      document.removeEventListener('click', handleClose);
      window.removeEventListener('resize', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [activeMenu]);

  // Determine active cameras list (API cameras or fallback mock feeds when requested)
  const effectiveCameras = useMemo(() => {
    if (useFallback) return DEFAULT_CAMERAS;
    if (cameras.length > 0) return cameras;
    return [];
  }, [cameras, useFallback]);

  // Filter and sort cameras for Live Tab
  const filteredCameras = useMemo(() => {
    return effectiveCameras.filter(cam => {
      const matchSearch = !searchQuery || 
        cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || cam.status === statusFilter;
      const matchMode = modeFilter === 'all' || 
        (modeFilter === '360' && cam.type === '360°') ||
        (modeFilter === 'ptz' && cam.type === 'PTZ') ||
        (modeFilter === 'fixed' && cam.type === 'Fixed');
      const matchStorage = storageFilter === 'all' || 
        (storageFilter === 'local' && cam.storage === 'Local SSD') ||
        (storageFilter === 'cloud' && cam.storage === 'Cloud Vault') ||
        (storageFilter === 'edge' && cam.storage === 'Edge NVR');

      return matchSearch && matchStatus && matchMode && matchStorage;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortBy === 'fps') cmp = a.fps - b.fps;
      else if (sortBy === 'storage') cmp = a.storage.localeCompare(b.storage);
      return sortAsc ? cmp : -cmp;
    });
  }, [effectiveCameras, searchQuery, statusFilter, modeFilter, storageFilter, sortBy, sortAsc]);

  // Filter historical recordings for History Tab
  const filteredRecordings = useMemo(() => {
    return HISTORICAL_RECORDINGS.filter(rec => {
      const matchSearch = !historySearchQuery ||
        rec.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        rec.cameraId.toLowerCase().includes(historySearchQuery.toLowerCase());
      const matchType = historyEventType === 'all' || rec.eventType.toLowerCase() === historyEventType.toLowerCase();
      return matchSearch && matchType;
    });
  }, [historySearchQuery, historyEventType]);

  const handleOpenMenu = (camId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 170;
    const menuHeight = 125;
    const openUpwards = rect.bottom + menuHeight > window.innerHeight;

    setActiveMenu({
      id: camId,
      top: openUpwards ? Math.max(10, rect.top - menuHeight - 6) : rect.bottom + 6,
      left: Math.max(12, Math.min(window.innerWidth - menuWidth - 12, rect.right - menuWidth))
    });
  };

  const handleDeleteCamera = (id: string) => {
    setCameras(prev => prev.filter(c => c.id !== id));
    setActiveMenu(null);
  };

  // Grid column CSS style based on gridLayout
  const gridColumnsStyle = useMemo(() => {
    switch (gridLayout) {
      case '1x1':
        return '1fr';
      case '2x2':
        return 'repeat(auto-fit, minmax(420px, 1fr))';
      case '4x4':
        return 'repeat(auto-fit, minmax(260px, 1fr))';
      case '3x3':
      default:
        return 'repeat(auto-fit, minmax(320px, 1fr))';
    }
  }, [gridLayout]);

  return (
    <div className="figma-account-settings-page-wrapper">
      <div className="figma-account-settings-container">
        {/* Page Header conforming to Base Application */}
        <PageHeader 
          title="Flashback" 
          subtitle="Forensic time-travel, multi-channel live surveillance, and recorded video archives"
          icon={<History size={20} />}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="success">Surveillance Engine Online</Badge>
            </div>
          }
        />

        {/* Tab Navigation Strip (Follows Base Application & Image 2) */}
        <div className="flashback-tabs-container" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'live'}
            onClick={() => setActiveTab('live')}
            className={`flashback-tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          >
            <span className="flashback-tab-icon-badge">
              <Video size={16} />
            </span>
            <span>Live</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            className={`flashback-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          >
            <span className="flashback-tab-icon-badge">
              <History size={16} />
            </span>
            <span>History</span>
          </button>
        </div>

        {/* TAB 1: LIVE CAMERAS VIEW */}
        {activeTab === 'live' && (
          <Card>
            <CardHeader
              action={
                <button 
                  className="figma-btn-edit-square" 
                  title="Live Grid Settings"
                  onClick={() => setIsSettingsOpen(true)}
                  style={{ width: '34px', height: '34px' }}
                >
                  <Settings size={17} />
                </button>
              }
            >
              <CardTitle gradient={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '16px' }}>Live Cameras</span>
                  <span title="Real-time multi-channel optical feeds and monitoring grid" style={{ cursor: 'help', color: 'var(--text-muted)' }}>
                    <Info size={16} />
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardBody>
              {/* Controls Bar: Search, Filters, Sorting, Grid Selector */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '20px'
                }}
              >
                {/* Left Controls: Search & Filter Dropdowns */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <SearchField 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search camera..."
                  />

                  <div style={{ width: '135px' }}>
                    <CustomSmoothDropdown 
                      label="Status"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      options={[
                        { label: 'All Status', value: 'all' },
                        { label: 'Online / Live', value: 'live' },
                        { label: 'Offline', value: 'offline' }
                      ]}
                    />
                  </div>

                  <div style={{ width: '135px' }}>
                    <CustomSmoothDropdown 
                      label="Mode"
                      value={modeFilter}
                      onChange={setModeFilter}
                      options={[
                        { label: 'All Modes', value: 'all' },
                        { label: '360° View', value: '360' },
                        { label: 'PTZ Pan-Tilt', value: 'ptz' },
                        { label: 'Fixed Lens', value: 'fixed' }
                      ]}
                    />
                  </div>

                  <div style={{ width: '140px' }}>
                    <CustomSmoothDropdown 
                      label="Storage"
                      value={storageFilter}
                      onChange={setStorageFilter}
                      options={[
                        { label: 'All Storage', value: 'all' },
                        { label: 'Local SSD', value: 'local' },
                        { label: 'Cloud Vault', value: 'cloud' },
                        { label: 'Edge NVR', value: 'edge' }
                      ]}
                    />
                  </div>
                </div>

                {/* Right Controls: Sort & Grid Layout */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '120px' }}>
                    <CustomSmoothDropdown 
                      label="Sort By"
                      value={sortBy}
                      onChange={setSortBy}
                      options={[
                        { label: 'Name', value: 'name' },
                        { label: 'Status', value: 'status' },
                        { label: 'Storage', value: 'storage' },
                        { label: 'FPS', value: 'fps' }
                      ]}
                    />
                  </div>

                  <button 
                    className="figma-btn-cancel"
                    onClick={() => setSortAsc(!sortAsc)}
                    title={sortAsc ? "Sort Ascending" : "Sort Descending"}
                    style={{ padding: '7px 11px', fontSize: '12.5px', height: '36px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {sortAsc ? '↑ Asc' : '↓ Desc'}
                  </button>

                  {/* Grid Layout Selector: 1x1, 2x2, 3x3, 4x4 */}
                  <div className="flashback-grid-selector" title="Grid Layout">
                    {(['1x1', '2x2', '3x3', '4x4'] as const).map(layout => (
                      <button
                        key={layout}
                        type="button"
                        className={`flashback-grid-btn ${gridLayout === layout ? 'active' : ''}`}
                        onClick={() => setGridLayout(layout)}
                      >
                        {layout}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* API ERROR / RETRY STATE (Exact match to user reference image) */}
              {apiError && !useFallback && (
                <div className="flashback-error-box">
                  <AlertCircle size={32} style={{ color: 'var(--danger, #ef4444)', marginBottom: '8px' }} />
                  <div className="flashback-error-title">Couldn't load cameras</div>
                  <div className="flashback-error-desc">{apiError}</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="figma-btn-save"
                      onClick={fetchCamerasFromApi}
                      disabled={isLoading}
                      style={{ padding: '7px 20px', fontSize: '13px' }}
                    >
                      {isLoading ? 'Retrying...' : 'Retry'}
                    </button>
                    <button 
                      className="figma-btn-cancel"
                      onClick={() => setUseFallback(true)}
                      style={{ padding: '7px 16px', fontSize: '13px' }}
                    >
                      Load Local Cameras
                    </button>
                  </div>
                </div>
              )}

              {/* CAMERA CARDS GRID */}
              {(!apiError || useFallback) && (
                filteredCameras.length > 0 ? (
                  <div 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: gridColumnsStyle, 
                      gap: '16px' 
                    }}
                  >
                    {filteredCameras.map(cam => {
                      const isLive = cam.status === 'live';
                      return (
                        <div key={cam.id} className="camera-card">
                          {/* Stream Preview Box */}
                          <div className={`camera-preview-box ${isLive ? 'is-live' : ''}`}>
                            <div className="camera-preview-overlay" />

                            {/* Stream Status Badge */}
                            <div className={`camera-stream-badge ${isLive ? 'live' : 'offline'}`}>
                              <span className="camera-stream-dot" />
                              <span>{isLive ? 'LIVE' : 'OFFLINE'}</span>
                            </div>

                            {/* Camera Type Badge */}
                            <div className="camera-type-badge">
                              {cam.type}
                            </div>

                            {/* Interactive Feed Content */}
                            {isLive ? (
                              <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.75)', zIndex: 1 }}>
                                <Radio size={36} style={{ color: '#10b981', marginBottom: '8px', animation: 'pulse 2s infinite' }} />
                                <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px', color: '#fff' }}>
                                  OPTICAL FEED ACTIVE
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '2px' }}>
                                  {cam.resolution} • {cam.fps} FPS
                                </div>
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', color: 'var(--text-muted)', zIndex: 1 }}>
                                <Camera size={34} style={{ opacity: 0.35, marginBottom: '8px' }} />
                                <div style={{ fontSize: '12px', fontWeight: 500 }}>Stream Disconnected</div>
                              </div>
                            )}

                            {/* Hover Quick Action to Open Fullscreen Stream */}
                            {isLive && (
                              <button
                                className="figma-btn-save"
                                onClick={() => setSelectedCameraForStream(cam)}
                                title="Expand Live Optical Feed"
                                style={{
                                  position: 'absolute',
                                  bottom: '12px',
                                  right: '12px',
                                  padding: '5px 12px',
                                  fontSize: '11.5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  zIndex: 3
                                }}
                              >
                                <Play size={12} /> Play
                              </button>
                            )}
                          </div>

                          {/* Camera Info Section utilizing Theme Studio surface */}
                          <div className="camera-card-info">
                            <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                              <div className="camera-name-text" title={cam.name}>
                                {cam.name}
                              </div>
                              <div className="camera-sub-text">
                                <span>{cam.storage}</span>
                                <span>•</span>
                                <span>{cam.location}</span>
                              </div>
                            </div>

                            <button 
                              className="camera-menu-btn"
                              title="Camera options"
                              onClick={(e) => handleOpenMenu(cam.id, e)}
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <Camera size={36} style={{ color: 'var(--text-muted)', opacity: 0.4, margin: '0 auto 12px' }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                      No cameras found
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
                      No camera match your search query "{searchQuery}". Try searching with a different name or clear active filters.
                    </div>
                    <button 
                      className="figma-btn-cancel"
                      onClick={() => { setSearchQuery(''); setStatusFilter('all'); setModeFilter('all'); setStorageFilter('all'); }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )
              )}
            </CardBody>
          </Card>
        )}

        {/* TAB 2: HISTORY (FORENSIC TIMELINE & ARCHIVED FOOTAGE) */}
        {activeTab === 'history' && (
          <div className="figma-settings-grid">
            <div className="figma-column-left">
              <Card>
                <CardHeader
                  action={
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className={`figma-btn-save ${historyTimeframe === '24h' ? '' : 'figma-btn-cancel'}`}
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                        onClick={() => setHistoryTimeframe('24h')}
                      >
                        Last 24 Hours
                      </button>
                      <button 
                        className={`figma-btn-save ${historyTimeframe === '7d' ? '' : 'figma-btn-cancel'}`}
                        style={{ padding: '5px 12px', fontSize: '12px' }}
                        onClick={() => setHistoryTimeframe('7d')}
                      >
                        Last 7 Days
                      </button>
                    </div>
                  }
                >
                  <CardTitle>Historical Footage & Timeline Events</CardTitle>
                </CardHeader>
                <CardBody>
                  {/* Forensic Time-Travel Scrubber Bar */}
                  <div 
                    style={{
                      background: 'var(--nested-bg, color-mix(in srgb, var(--text-main) 3%, transparent))',
                      border: '1px solid var(--border-light)',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={15} style={{ color: 'var(--primary)' }} /> Forensic Timeline Scrub
                      </span>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        Time: {activeTimelineTime}
                      </span>
                    </div>

                    {/* Timeline bar with incident tick marks */}
                    <div style={{ position: 'relative', width: '100%', height: '32px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-light)', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: '15%', width: '12%', height: '100%', background: 'color-mix(in srgb, var(--primary) 25%, transparent)', borderLeft: '2px solid var(--primary)' }} title="04:00 - Patrol Event" />
                      <div style={{ position: 'absolute', left: '38%', width: '8%', height: '100%', background: 'color-mix(in srgb, var(--warning, #f59e0b) 30%, transparent)', borderLeft: '2px solid var(--warning, #f59e0b)' }} title="09:14 - Loading Bay Motion" />
                      <div style={{ position: 'absolute', left: '46%', width: '6%', height: '100%', background: 'color-mix(in srgb, var(--info, #0ea5e9) 30%, transparent)', borderLeft: '2px solid var(--info, #0ea5e9)' }} title="11:05 - Door Access" />
                      <div style={{ position: 'absolute', left: '60%', width: '14%', height: '100%', background: 'color-mix(in srgb, var(--danger, #ef4444) 30%, transparent)', borderLeft: '2px solid var(--danger, #ef4444)' }} title="14:22 - Perimeter Alert" />
                      
                      {/* Scrub Pointer Needle */}
                      <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: '2px', background: '#dc2626', zIndex: 5, boxShadow: '0 0 6px rgba(220, 38, 38, 0.8)' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      <span>00:00:00</span>
                      <span>06:00:00</span>
                      <span>12:00:00</span>
                      <span>18:00:00</span>
                      <span>23:59:59</span>
                    </div>
                  </div>

                  {/* Filter & Search Bar for Historical Clips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <SearchField 
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Search archive clips..."
                    />

                    <div style={{ width: '160px' }}>
                      <CustomSmoothDropdown 
                        label="Incident Type"
                        value={historyEventType}
                        onChange={setHistoryEventType}
                        options={[
                          { label: 'All Incident Types', value: 'all' },
                          { label: 'Perimeter Alert', value: 'Perimeter Alert' },
                          { label: 'Door Access', value: 'Door Access' },
                          { label: 'Motion Detection', value: 'Motion Detection' },
                          { label: 'Patrol', value: 'Patrol' }
                        ]}
                      />
                    </div>
                  </div>

                  {/* Recordings List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredRecordings.map((rec) => (
                      <div 
                        key={rec.id}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                          background: 'var(--nested-bg, color-mix(in srgb, var(--text-main) 3%, transparent))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Film size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>{rec.title}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {rec.time} • Duration: {rec.duration} • Size: {rec.size} • <Badge variant="primary">{rec.eventType}</Badge>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button 
                            className="figma-btn-cancel" 
                            title="Play recording"
                            onClick={() => {
                              const foundCam = DEFAULT_CAMERAS.find(c => c.id === rec.cameraId);
                              if (foundCam) setSelectedCameraForStream(foundCam);
                            }}
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Play size={13} /> Review
                          </button>
                          <button 
                            className="figma-btn-edit-square" 
                            title="Download archive clip"
                            style={{ width: '32px', height: '32px' }}
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Storage Retention & Details Column */}
            <div className="figma-column-right">
              <Card>
                <CardHeader>
                  <CardTitle>Storage Retention</CardTitle>
                </CardHeader>
                <CardBody>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Retained Storage Pool</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>14.2 TB / 20.0 TB</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--border-light)', overflow: 'hidden' }}>
                      <div style={{ width: '71%', height: '100%', background: 'var(--primary)', borderRadius: '999px' }} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                      Automated FIFO retention cycle set to 30 days rolling backup for standard HD footage and 90 days for flagged security incident highlights.
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {/* Action Menu Popover */}
        {activeMenu && (
          <div 
            className="camera-actions-popover"
            style={{ top: `${activeMenu.top}px`, left: `${activeMenu.left}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="camera-action-item"
              onClick={() => {
                const cam = effectiveCameras.find(c => c.id === activeMenu.id);
                if (cam) setSelectedCameraForStream(cam);
                setActiveMenu(null);
              }}
            >
              <Eye size={15} />
              <span>View</span>
            </button>
            <button 
              className="camera-action-item"
              onClick={() => {
                setIsSettingsOpen(true);
                setActiveMenu(null);
              }}
            >
              <Settings size={15} />
              <span>Edit</span>
            </button>
            <button 
              className="camera-action-item danger"
              onClick={() => handleDeleteCamera(activeMenu.id)}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        )}

        {/* Live Stream Player Modal */}
        {selectedCameraForStream && (
          <Modal
            isOpen={Boolean(selectedCameraForStream)}
            onClose={() => setSelectedCameraForStream(null)}
            title={`Optical Live Feed: ${selectedCameraForStream.name}`}
            maxWidth="680px"
            footer={
              <button className="figma-btn-save" onClick={() => setSelectedCameraForStream(null)}>
                Close Feed
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div 
                style={{
                  height: '360px',
                  borderRadius: '10px',
                  background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #030712 100%)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ position: 'absolute', top: '14px', left: '14px' }}>
                  <div className="camera-stream-badge live">
                    <span className="camera-stream-dot" />
                    <span>BROADCASTING • {selectedCameraForStream.resolution}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: '#fff' }}>
                  <Radio size={48} style={{ color: '#10b981', marginBottom: '12px', animation: 'pulse 2s infinite' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Optical Stream Transmitting</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '4px' }}>
                    Codec: H.265 • Bitrate: 6.2 Mbps • FPS: {selectedCameraForStream.fps}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <span>Camera ID: {selectedCameraForStream.id}</span>
                <span>Type: {selectedCameraForStream.type}</span>
                <span>Storage: {selectedCameraForStream.storage}</span>
                <span>Location: {selectedCameraForStream.location}</span>
              </div>
            </div>
          </Modal>
        )}

        {/* Camera Grid Settings Modal */}
        {isSettingsOpen && (
          <Modal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            title="Live Grid & Surveillance Settings"
            maxWidth="520px"
            footer={
              <button className="figma-btn-save" onClick={() => setIsSettingsOpen(false)}>
                Save Settings
              </button>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="figma-label">Default Grid View</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {(['1x1', '2x2', '3x3', '4x4'] as const).map(l => (
                    <button
                      key={l}
                      type="button"
                      className={`figma-btn-cancel ${gridLayout === l ? 'active' : ''}`}
                      onClick={() => setGridLayout(l)}
                      style={{
                        padding: '6px 14px',
                        background: gridLayout === l ? 'var(--primary)' : undefined,
                        color: gridLayout === l ? '#fff' : undefined
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="figma-label">Auto-Refresh Interval</label>
                <div style={{ marginTop: '6px' }}>
                  <CustomSmoothDropdown 
                    label="Refresh Rate"
                    value="realtime"
                    onChange={() => {}}
                    options={[
                      { label: 'Real-time WebSocket (Low Latency)', value: 'realtime' },
                      { label: 'Every 5 seconds', value: '5s' },
                      { label: 'Every 15 seconds', value: '15s' }
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="figma-label">Stream Quality Mode</label>
                <div style={{ marginTop: '6px' }}>
                  <CustomSmoothDropdown 
                    label="Quality Mode"
                    value="adaptive"
                    onChange={() => {}}
                    options={[
                      { label: 'Adaptive Bitrate (Recommended)', value: 'adaptive' },
                      { label: 'Force 4K UHD Original', value: '4k' },
                      { label: 'Bandwidth Saver (720p)', value: '720p' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
}
