import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutGrid,
  Grid,
  Store,
  BarChart2,
  Palette,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen
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
  showLabels: boolean;
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
  showLabels,
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
        ${(!isSidebarCollapsed && !showLabels) ? `
          .dash-sidebar:not(.collapsed) .nav-label,
          .dash-sidebar:not(.collapsed) .nav-section-title,
          .dash-sidebar:not(.collapsed) .nav-divider {
            display: none !important;
          }
        ` : ''}
      `}</style>

      <aside
        ref={sidebarRef}
        className={`dash-sidebar ${!isLocked ? 'unlocked' : ''} ${(!isLocked && isVisible) || !autoHideSidebar || isEditing ? 'visible' : ''} ${isSidebarCollapsed ? 'collapsed' : ''} ${isEditing ? 'editing-focus' : ''}`}
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
              borderBottom: '1px solid var(--border-light, var(--border-light))'
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
                <PanelLeftOpen size={20} />
              </button>
            </div>
          </div>
        )}

        <div
          className="sidebar-nav"
          style={{ paddingTop: isSidebarCollapsed ? '0' : '16px' }}
        >
          <a
            href="#"
            className={`nav-item ${activeItemId === 'overview' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('overview', e, 'overview')}
            style={{ display: 'flex', alignItems: 'center', width: '100%', position: 'relative' }}
            onMouseEnter={(e) => handleItemMouseEnter("Dashboard", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <LayoutGrid size={20} className="nav-icon" color="var(--primary)" />
            <span className="nav-label" style={{ flex: 1 }}>Dashboard</span>
            {!isSidebarCollapsed && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px' }}
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
                    color: isLocked ? 'var(--primary)' : 'var(--text-muted)',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.05s ease'
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
                    color: 'var(--text-muted)',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.05s ease'
                  }}
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
            )}
          </a>
          <a
            href="#"
            className="nav-item"
            onClick={(e) => handleNavItemClick(null, e)}
            onMouseEnter={(e) => handleItemMouseEnter("Menu Item 1", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <Grid size={20} className="nav-icon" color="var(--success)" />
            <span className="nav-label">Menu Item 1</span>
          </a>
          <a
            href="#"
            className="nav-item"
            onClick={(e) => handleNavItemClick(null, e)}
            onMouseEnter={(e) => handleItemMouseEnter("Menu Item 2", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <Store size={20} className="nav-icon" color="var(--warning)" />
            <span className="nav-label">Menu Item 2</span>
          </a>

          <div className="nav-section-title">REPORTS</div>
          <div className="nav-divider"></div>

          <a
            href="#reports"
            className={`nav-item ${activeItemId === 'report-builder' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('reports', e, 'report-builder')}
            onMouseEnter={(e) => handleItemMouseEnter("User", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <BarChart2 size={20} className="nav-icon" color="#8b5cf6" />
            <span className="nav-label">User</span>
          </a>

          <div className="nav-section-title">SYSTEM</div>
          <div className="nav-divider"></div>

          <a
            href="#"
            className={`nav-item ${activeItemId === 'theme-studio' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('theme-studio', e, 'theme-studio')}
            onMouseEnter={(e) => handleItemMouseEnter("Theme Studio", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <Palette size={20} className="nav-icon" color="#14b8a6" />
            <span className="nav-label">Theme Studio</span>
          </a>
          <a
            href="#"
            className={`nav-item ${activeItemId === 'account' ? 'active' : ''}`}
            onClick={(e) => handleNavItemClick('account', e, 'account')}
            onMouseEnter={(e) => handleItemMouseEnter("Account Settings", e)}
            onMouseLeave={handleItemMouseLeave}
          >
            <UserCircle size={20} className="nav-icon" color="#6366f1" />
            <span className="nav-label">Account Settings</span>
          </a>
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
