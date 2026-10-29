import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MoreVertical, 
  Video, 
  Camera, 
  Radio, 
  Eye, 
  Settings, 
  Trash2,
  Play,
  Pause,
  ChevronDown,
  Tv,
  ArrowLeftRight,
  Bell,
  Maximize
} from 'lucide-react';
import { Card } from '../shared/Card';
import { PageHeader } from '../shared/PageHeader';
import { SearchField } from '../shared/SearchField';
import { CustomSmoothDropdown } from '../shared/CustomSmoothDropdown';
import { Modal } from '../shared/Modal';
import '../AccountSettings/AccountSettings.css';
import '../shared/SharedUI.css';

export interface CameraItem {
  id: string;
  name: string;
  type: '360°' | 'PTZ' | 'Fixed';
  location: 'Indoor' | 'Outdoor';
  hasStream: boolean;
  streamText?: string;
  resolution: string;
  fps: number;
}

const INITIAL_CAMERAS: CameraItem[] = [
  {
    id: 'cam-1',
    name: 'Cafeteria Counter',
    type: 'Fixed',
    location: 'Indoor',
    hasStream: false,
    streamText: 'No 360° stream',
    resolution: '1080p FHD',
    fps: 30
  },
  {
    id: 'cam-2',
    name: 'Chennai Rooftop 360',
    type: '360°',
    location: 'Outdoor',
    hasStream: true,
    resolution: '4K UHD',
    fps: 30
  },
  {
    id: 'cam-3',
    name: 'Loading Dock',
    type: 'Fixed',
    location: 'Outdoor',
    hasStream: false,
    streamText: 'No 360° stream',
    resolution: '1080p FHD',
    fps: 30
  },
  {
    id: 'cam-4',
    name: 'Main Gate PTZ',
    type: 'PTZ',
    location: 'Outdoor',
    hasStream: false,
    streamText: 'No 360° stream',
    resolution: '4K UHD',
    fps: 60
  },
  {
    id: 'cam-5',
    name: 'Perimeter East',
    type: 'Fixed',
    location: 'Outdoor',
    hasStream: false,
    streamText: 'No 360° stream',
    resolution: '1080p FHD',
    fps: 30
  },
  {
    id: 'cam-6',
    name: 'Server Room',
    type: 'Fixed',
    location: 'Indoor',
    hasStream: false,
    streamText: 'No 360° stream',
    resolution: '4K UHD',
    fps: 60
  },
  {
    id: 'cam-7',
    name: 'Street PTZ',
    type: 'PTZ',
    location: 'Outdoor',
    hasStream: true,
    resolution: '4K UHD',
    fps: 30
  },
  {
    id: 'cam-8',
    name: 'Warehouse Aisle',
    type: 'Fixed',
    location: 'Indoor',
    hasStream: false,
    streamText: 'No 360° stream',
    resolution: '1080p FHD',
    fps: 30
  }
];

const FILTER_OPTIONS = [
  { label: 'All Cameras', value: 'all' },
  { label: 'Chennai Rooftop 360', value: 'Chennai Rooftop 360' },
  { label: 'Street PTZ', value: 'Street PTZ' },
  { label: 'Server Room', value: 'Server Room' },
  { label: 'Warehouse Aisle', value: 'Warehouse Aisle' },
  { label: 'Main Gate PTZ', value: 'Main Gate PTZ' },
  { label: 'Cafeteria Counter', value: 'Cafeteria Counter' },
  { label: 'Loading Dock', value: 'Loading Dock' },
  { label: 'Perimeter East', value: 'Perimeter East' }
];

interface OomniWatchPageProps {
  onNavigate?: (view: string, options?: any) => void;
}

export function OomniWatchPage({ onNavigate: _onNavigate }: OomniWatchPageProps = {}) {
  const [cameras, setCameras] = useState<CameraItem[]>(INITIAL_CAMERAS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const handleDeleteCamera = (id: string) => {
    setCameras(prev => prev.filter(c => c.id !== id));
    setActiveMenu(null);
    if (selectedCameraForModal?.id === id) {
      setSelectedCameraForModal(null);
    }
  };
  
  // Action Menu Portal State
  const [activeMenu, setActiveMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [selectedCameraForModal, setSelectedCameraForModal] = useState<CameraItem | null>(null);
  const [modalMode, setModalMode] = useState<'stream' | 'details' | null>(null);

  // Live View Modal Enhanced State (Matching Reference Screenshot)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [projectionMode, setProjectionMode] = useState<'flat' | '360'>('360');
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState<boolean>(false);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 50, y: 78 });
  const [ptzCoords, setPtzCoords] = useState<{ pan: number; tilt: number }>({ pan: 0, tilt: 0 });
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [isSubStream, setIsSubStream] = useState<boolean>(false);

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

  // Filter cameras based on search query and dropdown selection
  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      // Search matching
      const matchesSearch = !searchQuery || cam.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Camera filter matching
      const matchesFilter = filterType === 'all' || cam.name.toLowerCase() === filterType.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [cameras, searchQuery, filterType]);

  // Close action menu on click outside or scroll
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

  return (
    <div className="figma-account-settings-page-wrapper" style={{ paddingBottom: '24px' }}>
      <div className="figma-account-settings-container">
        {/* Page Header conforming to Account Settings */}
        <PageHeader 
          title="Cameras" 
          icon={<Camera size={20} />}
          actions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            </div>
          }
        />

        {/* Filter & Search Bar matching Account Settings controls */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <SearchField 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search camera..."
            />

            {/* Camera Filter Dropdown */}
            <div style={{ minWidth: '200px' }}>
              <CustomSmoothDropdown
                label="Camera Filter"
                value={filterType}
                onChange={(val) => setFilterType(val)}
                options={FILTER_OPTIONS}
              />
            </div>
          </div>
        </div>

        {/* Camera Cards Grid */}
        {filteredCameras.length > 0 ? (
          <div className="camera-grid">
            {filteredCameras.map((cam) => (
              <Card 
                key={cam.id} 
                className="camera-card"
                onClick={() => {
                  setSelectedCameraForModal(cam);
                  setModalMode('stream');
                }}
              >
                {/* Camera Preview Area */}
                <div className={`camera-preview-box ${cam.hasStream ? 'is-live' : 'is-offline'}`}>
                  {/* Subtle Vignette Gradient Overlay */}
                  <div className="camera-preview-overlay" />

                  {/* Status Badge */}
                  <div className={`camera-stream-badge ${cam.hasStream ? 'live' : 'offline'}`}>
                    <span className="camera-stream-dot" />
                    <span>{cam.hasStream ? 'LIVE' : 'OFFLINE'}</span>
                  </div>

                  {/* Camera Profile Badge (Right Top) */}
                  <div className="camera-type-badge">
                    {cam.type}
                  </div>

                  {/* Center Content Placeholder */}
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

                {/* Card Info Section */}
                <div className="camera-card-info">
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                    <div className="camera-name-text" title={cam.name}>
                      {cam.name}
                    </div>
                    <div className="camera-sub-text">
                      <span>{cam.location}</span>
                      <span>•</span>
                      <span>{cam.type}</span>
                    </div>
                  </div>

                  <button
                    className="camera-menu-btn"
                    title="Camera options"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenMenu(cam.id, e);
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
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
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', marginBottom: '20px' }}>
              No cameras matched your search query "{searchQuery}". Try searching with a different name or clearing filters.
            </div>
            <button
              className="figma-btn-cancel"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
              }}
            >
              Reset Filters
            </button>
          </Card>
        )}
      </div>

      {/* Floating Action Menu Portal */}
      {activeMenu &&
        createPortal(
          <div
            className="camera-actions-popover"
            style={{
              top: activeMenu.top,
              left: activeMenu.left
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const cam = cameras.find(c => c.id === activeMenu.id);
              if (!cam) return null;
              return (
                <>
                  <button
                    type="button"
                    className="camera-action-item"
                    onClick={() => {
                      setSelectedCameraForModal(cam);
                      setModalMode('stream');
                      setActiveMenu(null);
                    }}
                  >
                    <Eye size={15} style={{ color: 'var(--primary)' }} />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    className="camera-action-item"
                    onClick={() => {
                      setSelectedCameraForModal(cam);
                      setModalMode('details');
                      setActiveMenu(null);
                    }}
                  >
                    <Settings size={15} style={{ color: 'var(--text-muted)' }} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    className="camera-action-item danger"
                    onClick={() => handleDeleteCamera(cam.id)}
                  >
                    <Trash2 size={15} style={{ color: 'var(--danger, #ef4444)' }} />
                    <span>Delete</span>
                  </button>
                </>
              );
            })()}
          </div>,
          document.body
        )}

      {/* Camera Live Stream / Detail Modal (Matching User Reference Image) */}
      {selectedCameraForModal && (
        <Modal
          isOpen={Boolean(selectedCameraForModal)}
          onClose={() => {
            setSelectedCameraForModal(null);
            setIsCameraDropdownOpen(false);
          }}
          title={modalMode === 'stream' ? "Live View" : `Node Info: ${selectedCameraForModal.name}`}
          maxWidth={modalMode === 'stream' ? "980px" : "640px"}
        >
          {modalMode === 'stream' ? (
            <div className="liveview-card">
              
              {/* Panoramic Viewport Area */}
              <div 
                className="liveview-viewport"
                onClick={handleViewportClick}
              >
                {/* Simulated / Real Camera Live Feed */}
                <img
                  src={selectedCameraForModal.name === 'Chennai Rooftop 360' ? '/images/chennai-rooftop-360.png' : (
                    selectedCameraForModal.hasStream 
                      ? '/images/chennai-rooftop-360.png' 
                      : '/images/live-digital-twin.png'
                  )}
                  alt={selectedCameraForModal.name}
                  className={`liveview-feed-img ${projectionMode === '360' ? 'panoramic' : 'flat'}`}
                  style={{
                    filter: isPlaying ? 'none' : 'grayscale(35%) brightness(0.85)',
                    transform: projectionMode === '360' ? 'scale(1.06)' : 'none'
                  }}
                />

                {/* Vignette Overlay */}
                <div className="camera-preview-overlay" />

                {/* Top-Left PTZ Status Badge */}
                <div className="liveview-ptz-badge">
                  <div className="liveview-ptz-badge-title">
                    <span>PTZ</span>
                    <span className="liveview-ptz-badge-indicator" />
                  </div>
                  <div className="liveview-ptz-badge-coords">
                    Pan: {ptzCoords.pan}° &nbsp;Tilt: {ptzCoords.tilt}°
                  </div>
                </div>

                {/* Top-Right Floating Control Bar (Glassmorphism) */}
                <div 
                  className="liveview-controls-bar"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Camera Name Selector Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="liveview-camera-select-trigger"
                      onClick={() => setIsCameraDropdownOpen(prev => !prev)}
                      title="Switch Camera Node"
                    >
                      <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedCameraForModal.name}
                      </span>
                      <ChevronDown size={14} style={{ transform: isCameraDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                    </button>

                    {isCameraDropdownOpen && (
                      <div className="liveview-camera-dropdown">
                        {cameras.map(cam => (
                          <button
                            key={cam.id}
                            type="button"
                            className={`liveview-camera-item ${cam.id === selectedCameraForModal.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedCameraForModal(cam);
                              setIsCameraDropdownOpen(false);
                            }}
                          >
                            <Video size={14} />
                            <span>{cam.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.2)' }} />

                  {/* Flat / 360 View Mode Toggle */}
                  <div
                    className={`liveview-projection-toggle ${projectionMode === '360' ? 'is-360' : 'is-flat'}`}
                    onClick={() => setProjectionMode(prev => prev === '360' ? 'flat' : '360')}
                    title="Toggle Panoramic Projection Mode"
                  >
                    <span style={{ opacity: projectionMode === 'flat' ? 1 : 0.6, fontWeight: projectionMode === 'flat' ? 700 : 500 }}>
                      Flat
                    </span>
                    <span className="liveview-toggle-knob" />
                    <span style={{ opacity: projectionMode === '360' ? 1 : 0.6, fontWeight: projectionMode === '360' ? 700 : 500 }}>
                      360°
                    </span>
                  </div>

                  {/* Picture-in-Picture / Multi-feed button */}
                  <button
                    type="button"
                    className="liveview-icon-btn"
                    onClick={() => alert(`Picture-in-picture mode initiated for ${selectedCameraForModal.name}`)}
                    title="Picture in Picture"
                  >
                    <Tv size={16} />
                  </button>

                  {/* Switch Stream / Secondary stream */}
                  <button
                    type="button"
                    className="liveview-icon-btn"
                    onClick={() => setIsSubStream(prev => !prev)}
                    title={isSubStream ? "Switch to 360° Main Stream" : "Switch to PTZ Sub-Stream"}
                    style={{ color: isSubStream ? '#3b82f6' : 'rgba(255, 255, 255, 0.85)' }}
                  >
                    <ArrowLeftRight size={16} />
                  </button>

                  {/* Alert notification bell */}
                  <button
                    type="button"
                    className="liveview-icon-btn"
                    onClick={() => setIsAlertActive(prev => !prev)}
                    title={isAlertActive ? "Mute Camera Alerts" : "Camera Alert Monitoring Active"}
                    style={{ color: isAlertActive ? '#ef4444' : 'rgba(255, 255, 255, 0.85)' }}
                  >
                    <Bell size={16} />
                    {isAlertActive && (
                      <span style={{ position: 'absolute', top: '5px', right: '5px', width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                    )}
                  </button>

                  {/* Stream Settings / More options */}
                  <button
                    type="button"
                    className="liveview-icon-btn"
                    onClick={() => alert(`RTSP Stream Settings:\nCamera: ${selectedCameraForModal.name}\nResolution: ${selectedCameraForModal.resolution}\nFPS: ${selectedCameraForModal.fps}`)}
                    title="Stream Settings"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Fullscreen button */}
                  <button
                    type="button"
                    className="liveview-icon-btn"
                    onClick={() => {
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(() => {});
                      } else {
                        document.exitFullscreen().catch(() => {});
                      }
                    }}
                    title="Toggle Fullscreen"
                  >
                    <Maximize size={16} />
                  </button>
                </div>

                {/* Center Bottom Play / Pause Button */}
                <button
                  type="button"
                  className="liveview-play-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying(prev => !prev);
                  }}
                  title={isPlaying ? "Pause Stream" : "Play Stream"}
                >
                  {isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />
                  )}
                </button>

                {/* Interactive Blue PTZ Focal Target Ring on Ground */}
                <div 
                  className="liveview-focal-target"
                  style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
                >
                  <span className="liveview-focal-dot" />
                </div>

              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                Hardware model configuration, RTSP edge endpoint settings, and analytics triggers for <strong>{selectedCameraForModal.name}</strong>.
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--nested-bg)', border: '1px solid var(--border-light)', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                rtsp://stream.oomniwatch.internal:554/live/{selectedCameraForModal.id}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
