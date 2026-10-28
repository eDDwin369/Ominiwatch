import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Radio,
  BrainCircuit,
  History,
  Settings,
  ChevronRight,
  ChevronLeft,
  User,
  Palette
} from 'lucide-react';
import './Dashboard.css';

function OomniWatchIcon({ size = 20, className = '', color = '#10b981', style }: { size?: number; className?: string; color?: string; style?: React.CSSProperties }) {
  const strokeColor = color || (style?.color as string) || '#10b981';
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={strokeColor} 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      style={{ color: strokeColor, stroke: strokeColor, ...style }}
    >
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M16 4h3a1 1 0 0 1 1 1v3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
      <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  );
}

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isThemeStudioOpen?: boolean;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  autoHideSidebar: boolean;
  showIcons: boolean;
  isEditing?: boolean;
}

export function Sidebar({
  currentView,
  setCurrentView,
  isThemeStudioOpen,
  isLocked,
  setIsLocked,
  collapsed,
  setCollapsed,
  isVisible,
  setIsVisible,
  autoHideSidebar,
  showIcons,
  isEditing = false
}: SidebarProps) {

  // Evaluate collapsed status
  const isSidebarCollapsed = collapsed;

  // Hover state specifically for logo in collapsed state
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  // Hovered item for tooltip in collapsed state
  const [hoveredItem, setHoveredItem] = useState<{ label: string; x: number; y: number } | null>(null);
  // Single source of truth for which nav item is highlighted. Several items
  // map to the same `currentView` (e.g. both report items use 'reports'), so a
  // dedicated id prevents more than one item from appearing selected at once.
  const [activeItemId, setActiveItemId] = useState<string | null>('overview');

  const hideTimeoutRef = useRef<any>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Reset visibility when lock state changes
  useEffect(() => {
    if (!isLocked) {
      setIsVisible(false);
    }
  }, [isLocked]);

  // Clear tooltip when sidebar expands
  useEffect(() => {
    if (!collapsed) {
      setHoveredItem(null);
    }
  }, [collapsed]);

  // Keep the highlighted item in sync with currentView or isThemeStudioOpen
  useEffect(() => {
    if (isThemeStudioOpen) {
      setActiveItemId('administration');
      return;
    }
    if (currentView === 'overview' || currentView === 'oomni-watch') {
      setActiveItemId('oomni-watch');
    } else if (currentView === 'live-monitoring') {
      setActiveItemId('live-monitoring');
    } else if (currentView === 'ai-analysis') {
      setActiveItemId('ai-analysis');
    } else if (currentView === 'flashback') {
      setActiveItemId('flashback');
    } else if (currentView === 'administration' || currentView === 'account') {
      setActiveItemId('administration');
    } else {
      setActiveItemId('oomni-watch');
    }
  }, [currentView, isThemeStudioOpen]);

  // Collapse and hide sidebar when clicking outside in unpinned state
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isLocked) return;
      if (isSidebarCollapsed && !isVisible) return;
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setCollapsed(true);
        setIsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isLocked, isSidebarCollapsed, isVisible, setCollapsed, setIsVisible]);

  const handleMouseEnter = () => {
    if (!isLocked && autoHideSidebar) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
    if (!isLocked && autoHideSidebar) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setCollapsed(true);
      }, 800);
    }
  };

  const handleItemMouseEnter = (label: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isSidebarCollapsed) {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredItem({
        label,
        // rect.right (not a hardcoded rail-width constant) so this tracks the
        // actual collapsed width, which is user-configurable via Global Settings.
        x: rect.right + 8,
        y: rect.top + rect.height / 2
      });
    }
  };

  const handleItemMouseLeave = () => {
    setHoveredItem(null);
  };

  const handleNavItemClick = (view: string | null, e: React.MouseEvent, itemId?: string) => {
    e.preventDefault();
    // Don't let the click bubble to the <aside> onClick, which expands AND pins
    // the sidebar when collapsed. Selecting a menu item must not override the
    // user's auto-hide (unpinned) preference.
    e.stopPropagation();
    // Set the highlight immediately so it's unambiguous even when two items
    // share the same view (e.g. Report Builder vs Testing Reports).
    if (itemId) {
      setActiveItemId(itemId);
    }
    if (view) {
      setCurrentView(view);
    }
    if (!isLocked) {
      setIsVisible(false);
      setCollapsed(true);
    }
  };



  return (
    <>
      {/* Invisible Hover Zone on the left viewport edge (only when unlocked & hidden) */}
      {!isLocked && !isVisible && (
        <div
          onMouseEnter={handleMouseEnter}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '12px',
            zIndex: 9999,
            background: 'transparent'
          }}
        />
      )}

      <style>{`
        ${(!isSidebarCollapsed && !showIcons) ? `
          .dash-sidebar:not(.collapsed) .nav-icon {
            display: none !important;
          }
        ` : ''}
      `}</style>

      <aside
        ref={sidebarRef}
        className={`dash-sidebar ${!isLocked ? 'unlocked' : ''} ${isLocked || isVisible || !autoHideSidebar || isEditing ? 'visible' : ''} ${isSidebarCollapsed ? 'collapsed' : ''} ${isEditing ? 'editing-focus' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          if (isSidebarCollapsed) {
            setCollapsed(false);
            setIsLocked(true);
          }
        }}
        style={{ cursor: isSidebarCollapsed ? 'pointer' : 'default' }}
      >
        {isSidebarCollapsed && (
          <div
            className="sidebar-header"
            style={{
              height: '52px',
              display: 'flex',
              justifyContent: 'center',
              padding: '0',
              alignItems: 'center',
              transition: 'all 0.05s ease',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
            >
              <button
                title="Open sidebar"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  backgroundColor: isLogoHovered ? 'var(--bg-dashboard)' : 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isLogoHovered ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'all 0.05s ease'
                }}
                onMouseEnter={() => setIsLogoHovered(true)}
                onMouseLeave={() => setIsLogoHovered(false)}
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsed(false);
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        <div
          className="sidebar-nav"
          style={{ paddingTop: isSidebarCollapsed ? '0' : '12px' }}
        >
          {/* 1. Oomni Watch */}
          <a
            href="#dashboard/oomni-watch"
            className={`nav-item ${activeItemId === 'oomni-watch' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('oomni-watch', e, 'oomni-watch')}
            style={{ display: 'flex', alignItems: 'center', width: isSidebarCollapsed ? undefined : '100%', position: 'relative' }}
            onMouseEnter={(e) => handleItemMouseEnter("Oomni Watch", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <OomniWatchIcon size={20} color="#10b981" className="nav-icon" style={{ color: '#10b981', stroke: '#10b981' }} />
            </div>
            <span className="nav-label" style={{ flex: 1 }}>Oomni Watch</span>
            {!isSidebarCollapsed && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '2px' }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsLocked(!isLocked); }}
                  title={isLocked ? "Unlock sidebar" : "Lock sidebar"}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    borderRadius: '4px',
                    color: isLocked ? 'var(--primary, #2563EB)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                  className="sidebar-toggle"
                >
                  {isLocked ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="17" x2="12" y2="22" />
                      <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.26a2 2 0 0 1-.78 1.24l-2.78 3.5a2 2 0 0 0-.44 1.24Z" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-45deg)' }}>
                      <line x1="12" y1="17" x2="12" y2="22" />
                      <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4.26a2 2 0 0 1-.78 1.24l-2.78 3.5a2 2 0 0 0-.44 1.24Z" />
                    </svg>
                  )}
                </button>
                <button
                  className="sidebar-toggle"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCollapsed(true); }}
                  title="Collapse sidebar"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            )}
          </a>

          {/* 2. Live Monitoring */}
          <a
            href="#dashboard/live-monitoring"
            className={`nav-item ${activeItemId === 'live-monitoring' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('live-monitoring', e, 'live-monitoring')}
            onMouseEnter={(e) => handleItemMouseEnter("Live Monitoring", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={20} strokeWidth={2.2} color="#f59e0b" className="nav-icon" style={{ color: '#f59e0b', stroke: '#f59e0b' }} />
            </div>
            <span className="nav-label">Live Monitoring</span>
          </a>

          {/* 3. AI Analysis */}
          <a
            href="#dashboard/ai-analysis"
            className={`nav-item ${activeItemId === 'ai-analysis' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('ai-analysis', e, 'ai-analysis')}
            onMouseEnter={(e) => handleItemMouseEnter("AI Analysis", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrainCircuit size={20} strokeWidth={2.2} color="#8b5cf6" className="nav-icon" style={{ color: '#8b5cf6', stroke: '#8b5cf6' }} />
            </div>
            <span className="nav-label">AI Analysis</span>
          </a>

          {/* 4. Flashback */}
          <a
            href="#dashboard/flashback"
            className={`nav-item ${activeItemId === 'flashback' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('flashback', e, 'flashback')}
            onMouseEnter={(e) => handleItemMouseEnter("Flashback", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={20} strokeWidth={2.2} color="#ec4899" className="nav-icon" style={{ color: '#ec4899', stroke: '#ec4899' }} />
            </div>
            <span className="nav-label">Flashback</span>
          </a>

          {/* 5. Administration */}
          <a
            href="#dashboard/administration"
            className={`nav-item ${activeItemId === 'administration' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('administration', e, 'administration')}
            onMouseEnter={(e) => handleItemMouseEnter("Administration", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={20} strokeWidth={2.2} color="#6366f1" className="nav-icon" style={{ color: '#6366f1', stroke: '#6366f1' }} />
            </div>
            <span className="nav-label">Administration</span>
          </a>

          {/* Sub-navigation under Administration when expanded */}
          {!isSidebarCollapsed && activeItemId === 'administration' && (
            <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', marginBottom: '4px' }}>
              <a
                href="#dashboard/account"
                className={`nav-item ${currentView === 'account' ? 'active' : ''}`}
                onClick={(e) => handleNavItemClick('account', e, 'administration')}
                style={{ fontSize: '13px', padding: '6px 10px', height: 'auto', borderRadius: '8px' }}
              >
                <User size={15} strokeWidth={2.2} color="#6366f1" className="nav-icon" style={{ color: '#6366f1', stroke: '#6366f1' }} />
                <span className="nav-label">Account Settings</span>
              </a>
              <a
                href="#dashboard/theme-studio"
                className={`nav-item ${isThemeStudioOpen ? 'active' : ''}`}
                onClick={(e) => handleNavItemClick('theme-studio', e, 'administration')}
                style={{ fontSize: '13px', padding: '6px 10px', height: 'auto', borderRadius: '8px' }}
              >
                <Palette size={15} strokeWidth={2.2} color="#ec4899" className="nav-icon" style={{ color: '#ec4899', stroke: '#ec4899' }} />
                <span className="nav-label">Theme Studio</span>
              </a>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <div className="sidebar-bottom-action">
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div className="shrink-0" style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={16} style={{ transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </div>
            {!isSidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>

      </aside>

      {hoveredItem && createPortal(
        <div
          className="sidebar-fixed-tooltip"
          style={{ top: `${hoveredItem.y}px`, left: `${hoveredItem.x}px` }}
        >
          {hoveredItem.label}
        </div>,
        document.body
      )}
    </>
  );
}
