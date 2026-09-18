import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutGrid,
  Grid,
  Store,
  BarChart2,
  Palette,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import './Dashboard.css';

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

  // Keep the highlighted item in sync when navigation happens outside the
  // sidebar (or when Theme Studio is toggled). Theme Studio always wins while
  // open; otherwise the current view maps to a single item. For 'reports' —
  // which is shared by two items — we preserve whichever report item is already
  // selected so clicking one never highlights the other.
  useEffect(() => {
    if (isThemeStudioOpen) {
      setActiveItemId('theme-studio');
      return;
    }
    if (currentView === 'reports') {
      setActiveItemId('report-builder');
    } else if (currentView === 'overview') {
      setActiveItemId('overview');
    } else if (currentView === 'account') {
      setActiveItemId('account');
    } else {
      setActiveItemId(null);
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
          {/* Dashboard - active */}
          <a
            href="#"
            className={`nav-item ${activeItemId === 'overview' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('overview', e, 'overview')}
            style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}
            onMouseEnter={(e) => handleItemMouseEnter("Dashboard", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutGrid size={20} className="nav-icon" color="var(--highlight, var(--primary))" />
            </div>
            <span className="nav-label" style={{ flex: 1 }}>Dashboard</span>
            {!isSidebarCollapsed && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '2px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setIsLocked(!isLocked)}
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
                    color: isLocked ? 'var(--highlight, var(--primary))' : 'var(--text-muted)',
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
                  onClick={() => setCollapsed(true)}
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

          {/* Menu Item 1 */}
          <a
            href="#"
            className="nav-item"
            onClick={(e) => handleNavItemClick(null, e)}
            onMouseEnter={(e) => handleItemMouseEnter("Menu Item 1", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Grid size={20} className="nav-icon" color="#22C55E" />
            </div>
            <span className="nav-label">Menu Item 1</span>
          </a>

          {/* Menu Item 2 */}
          <a
            href="#"
            className="nav-item"
            onClick={(e) => handleNavItemClick(null, e)}
            onMouseEnter={(e) => handleItemMouseEnter("Menu Item 2", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} className="nav-icon" color="#F97316" />
            </div>
            <span className="nav-label">Menu Item 2</span>
          </a>

          {/* Reports section */}
          <div className="nav-section-title">
            <span>Reports</span>
          </div>

          <a
            href="#reports"
            className={`nav-item ${activeItemId === 'report-builder' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('reports', e, 'report-builder')}
            onMouseEnter={(e) => handleItemMouseEnter("Report Builder", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={20} className="nav-icon" color="#A855F7" />
            </div>
            <span className="nav-label">Report Builder</span>
          </a>

          {/* System section */}
          <div className="nav-section-title">
            <span>System</span>
          </div>

          <a
            href="#"
            className={`nav-item ${activeItemId === 'theme-studio' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('theme-studio', e, 'theme-studio')}
            onMouseEnter={(e) => handleItemMouseEnter("Theme Studio", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Palette size={20} className="nav-icon" color="#EC4899" />
            </div>
            <span className="nav-label">Theme Studio</span>
          </a>

          <a
            href="#"
            className={`nav-item ${activeItemId === 'account' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('account', e, 'account')}
            onMouseEnter={(e) => handleItemMouseEnter("Account Settings", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <div className="shrink-0" style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="nav-icon">
                <path d="M11.66 14.16H4.16" stroke="#6366F1" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15.82 5.83H8.33" stroke="#6366F1" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="14.16" cy="14.16" r="2.5" stroke="#6366F1" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="5.83" cy="5.83" r="2.5" stroke="#6366F1" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="nav-label">Account Settings</span>
          </a>
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
