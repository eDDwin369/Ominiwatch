import { useState, useRef, useEffect } from 'react';
import {
  Settings, Eye, Download, Upload, X, MoreVertical,
  LayoutPanelTop, Layout, LayoutPanelLeft, Users,
  RotateCcw, Info, Plus, Check, Star, Type, Image
} from 'lucide-react';
import './GlobalSettingsWorkspace.css';

import { ImageCropperModal } from './ImageCropperModal';

interface GlobalSettingsWorkspaceProps {
  onClose: () => void;
  headerConfig: {
    logo: string;
    showLogo: boolean;
    companyName: string;
    showCompanyName: boolean;
    companyCaption: string;
    showCompanyCaption: boolean;
    textColor: string;
    textColorApply: 'both' | 'name' | 'caption';
    companyNameColor?: string;
    companyCaptionColor?: string;
    companyNameStyle?: string;
    companyCaptionStyle?: string;
  };
  onSaveConfig: (config: any) => void;
  sidebarAutoHide: boolean;
  setSidebarAutoHide: (val: boolean) => void;
  sidebarExpandedWidth: number;
  setSidebarExpandedWidth: (val: number) => void;
  sidebarCollapsedWidth: number;
  setSidebarCollapsedWidth: (val: number) => void;
  sidebarShowIcons: boolean;
  setSidebarShowIcons: (val: boolean) => void;
  sidebarShowLabels: boolean;
  setSidebarShowLabels: (val: boolean) => void;
  onSyncFooter: (footerData: any) => void;
  setSidebarCollapsed: (val: boolean) => void;
  onTabChange?: (tab: string) => void;
  onSyncCustomerProfile?: (data: {
    showCustomerProfile: boolean;
    customerName: string;
    customerColorFollow: boolean;
    showCustomerLogo: boolean;
    customerLogo: string;
    customerNameStyle?: string;
    customerNameColor?: string;
  }) => void;
}

type TabId = 'header' | 'footer' | 'sidebar' | 'profile';

// Apple-style toggle switch
const AppleToggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: '42px',
        height: '24px',
        borderRadius: '9999px',
        backgroundColor: checked ? 'var(--primary)' : 'var(--border-hover)',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.05s ease',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: checked ? '20px' : '2px',
          width: '20px',
          height: '20px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '50%',
          transition: 'left 0.05s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      />
    </button>
  );
};

export function GlobalSettingsWorkspace({ 
  onClose, 
  headerConfig, 
  onSaveConfig,
  sidebarAutoHide,
  setSidebarAutoHide,
  sidebarExpandedWidth,
  setSidebarExpandedWidth,
  sidebarCollapsedWidth,
  setSidebarCollapsedWidth,
  sidebarShowIcons,
  setSidebarShowIcons,
  sidebarShowLabels,
  setSidebarShowLabels,
  onSyncFooter,
  setSidebarCollapsed,
  onTabChange,
  onSyncCustomerProfile
}: GlobalSettingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>('header');

  // Local form states (Header Config)

  // Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [pendingCropImage, setPendingCropImage] = useState('');
  const [cropperTarget, setCropperTarget] = useState<'header' | 'footer' | 'customer' | null>(null);

  const [logo, setLogo] = useState(headerConfig.logo);
  const [showLogo, setShowLogo] = useState(headerConfig.showLogo);
  const [companyName, setCompanyName] = useState(headerConfig.companyName);
  const [showCompanyName, setShowCompanyName] = useState(headerConfig.showCompanyName);
  const [companyCaption, setCompanyCaption] = useState(headerConfig.companyCaption);
  const [showCompanyCaption, setShowCompanyCaption] = useState(headerConfig.showCompanyCaption);
  const [textColor, setTextColor] = useState(headerConfig.textColor);
  const [textColorApply, setTextColorApply] = useState<any>(headerConfig.textColorApply);
  const [companyNameColor, setCompanyNameColor] = useState(headerConfig.companyNameColor || headerConfig.textColor || '#000000');
  const [companyCaptionColor, setCompanyCaptionColor] = useState(headerConfig.companyCaptionColor || headerConfig.textColor || 'var(--text-muted)');
  const [companyNameStyle, setCompanyNameStyle] = useState(headerConfig.companyNameStyle || 'h1');
  const [companyCaptionStyle, setCompanyCaptionStyle] = useState(headerConfig.companyCaptionStyle || 'h3');

  // Footer Config States
  const [footerVisible, setFooterVisible] = useState(() => {
    const saved = localStorage.getItem('gs_footerVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [copyrightText, setCopyrightText] = useState(() => {
    return localStorage.getItem('gs_copyrightText') || '© {year} OomniEye. All rights reserved.';
  });
  const [footerPoweredByType, setFooterPoweredByType] = useState<'text' | 'image'>(() => {
    try {
      const saved = localStorage.getItem('gs_footerPoweredByType');
      return saved ? JSON.parse(saved) : 'text';
    } catch {
      return 'text';
    }
  });
  const [footerPoweredByText, setFooterPoweredByText] = useState(() => {
    return localStorage.getItem('gs_footerPoweredByText') || 'Powered by OomniEye Digital Solutions';
  });
  const [footerPoweredByImage, setFooterPoweredByImage] = useState(() => {
    return localStorage.getItem('gs_footerPoweredByImage') || '';
  });
  const [footerLinks, setFooterLinks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gs_footerLinks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Sidebar Config States
  const [startExpanded, setStartExpanded] = useState(() => {
    const saved = localStorage.getItem('gs_startExpanded');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [autoHideSidebar, setAutoHideSidebar] = useState(sidebarAutoHide);
  const [expandedWidth, setExpandedWidth] = useState(sidebarExpandedWidth);
  const [collapsedWidth, setCollapsedWidth] = useState(sidebarCollapsedWidth);
  const [showIcons, setShowIcons] = useState(sidebarShowIcons);
  const [showLabels, setShowLabels] = useState(sidebarShowLabels);

  // Track if changes have been saved to avoid reverting on close
  const isSavedRef = useRef(false);

  // Close modal — changes are auto-persisted, no revert needed
  const handleCancelAndClose = () => {
    onClose();
  };

  // Sync Header config in real-time
  useEffect(() => {
    onSaveConfig({
      logo,
      showLogo,
      companyName,
      showCompanyName,
      companyCaption,
      showCompanyCaption,
      textColor,
      textColorApply,
      companyNameColor,
      companyCaptionColor,
      companyNameStyle,
      companyCaptionStyle
    });
  }, [logo, showLogo, companyName, showCompanyName, companyCaption, showCompanyCaption, textColor, textColorApply, companyNameColor, companyCaptionColor, companyNameStyle, companyCaptionStyle]);

  // Sync Footer config in real-time
  useEffect(() => {
    onSyncFooter({
      footerVisible,
      copyrightText,
      footerPoweredByType,
      footerPoweredByText,
      footerPoweredByImage,
      footerLinks
    });
  }, [footerVisible, copyrightText, footerPoweredByType, footerPoweredByText, footerPoweredByImage, footerLinks]);

  // Sync Sidebar config in real-time
  useEffect(() => {
    setSidebarAutoHide(autoHideSidebar);
    setSidebarExpandedWidth(expandedWidth);
    setSidebarCollapsedWidth(collapsedWidth);
    setSidebarShowIcons(showIcons);
    setSidebarShowLabels(showLabels);
  }, [autoHideSidebar, expandedWidth, collapsedWidth, showIcons, showLabels]);

  // Sync active settings tab with parent
  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeTab);
    }
  }, [activeTab, onTabChange]);

  // Clean up tab track on unmount
  useEffect(() => {
    return () => {
      if (onTabChange) onTabChange('');
    };
  }, [onTabChange]);

  // Security Config States
  // (Removed unused security states based on tsc output)

  // Customer Profile Config States
  const [showCustomerProfile, setShowCustomerProfile] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerProfile');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [customerName, setCustomerName] = useState(() => {
    return localStorage.getItem('gs_customerName') || 'Default Customer';
  });
  const [customerNameStyle, setCustomerNameStyle] = useState(() => {
    return localStorage.getItem('gs_customerNameStyle') || 'h1';
  });
  const [customerNameColor, setCustomerNameColor] = useState(() => {
    return localStorage.getItem('gs_customerNameColor') || '#1e293b';
  });

  const [customerColorFollow, setCustomerColorFollow] = useState(() => {
    const saved = localStorage.getItem('gs_customerColorFollow');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showCustomerLogo, setShowCustomerLogo] = useState(() => {
    const saved = localStorage.getItem('gs_showCustomerLogo');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [customerLogo, setCustomerLogo] = useState(() => {
    return localStorage.getItem('gs_customerLogo') || '';
  });

  const customerLogoInputRef = useRef<HTMLInputElement>(null);

  const handleCustomerLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPendingCropImage(reader.result);
          setCropperTarget('customer');
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync Customer Profile config in real-time
  useEffect(() => {
    if (onSyncCustomerProfile) {
      onSyncCustomerProfile({
        showCustomerProfile,
        customerName,
        customerColorFollow,
        showCustomerLogo,
        customerLogo,
        customerNameStyle,
        customerNameColor
      });
    }
  }, [showCustomerProfile, customerName, customerColorFollow, showCustomerLogo, customerLogo, customerNameStyle, customerNameColor, onSyncCustomerProfile]);

  // Equal height is now enforced via CSS (.gs-config-card height: 286px) to maintain a perfectly static layout.
  // Notifications Config States
  const [notificationsToShow] = useState(() => {
    const saved = localStorage.getItem('gs_notificationsToShow');
    return saved !== null ? JSON.parse(saved) : 5;
  });

  const [isHoveringExpanded, setIsHoveringExpanded] = useState(false);
  const [isDraggingExpanded, setIsDraggingExpanded] = useState(false);
  const [isHoveringCollapsed, setIsHoveringCollapsed] = useState(false);
  const [isDraggingCollapsed, setIsDraggingCollapsed] = useState(false);

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isHoveringExpanded || isDraggingExpanded) {
      setSidebarCollapsed(false);
    } else if (isHoveringCollapsed || isDraggingCollapsed) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(!startExpanded);
    }
  }, [isHoveringExpanded, isDraggingExpanded, isHoveringCollapsed, isDraggingCollapsed, startExpanded, setSidebarCollapsed]);

  // Removed unused containerRef
  const fileInputRef = useRef<HTMLInputElement>(null);
  const footerFileInputRef = useRef<HTMLInputElement>(null);

  // Sync form states with props if they change
  useEffect(() => {
    setLogo(headerConfig.logo);
    setShowLogo(headerConfig.showLogo);
    setCompanyName(headerConfig.companyName);
    setShowCompanyName(headerConfig.showCompanyName);
    setCompanyCaption(headerConfig.companyCaption);
    setShowCompanyCaption(headerConfig.showCompanyCaption);
    setTextColor(headerConfig.textColor);
    setTextColorApply(headerConfig.textColorApply);
  }, [headerConfig]);

  // Handle Logo file upload
  const handleFooterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPendingCropImage(reader.result);
          setCropperTarget('footer');
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPendingCropImage(reader.result);
          setCropperTarget('header');
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset to default settings
  const handleResetToDefaults = () => {
    if (window.confirm("Reset all settings to default values?")) {
      setLogo('');
      setShowLogo(true);
      setCompanyName('OomniEye');
      setShowCompanyName(true);
      setCompanyCaption('Digital Twin Solutions');
      setShowCompanyCaption(false);
      setTextColor('#000000');
      setTextColorApply('both');
      setCompanyNameColor('#000000');
      setCompanyCaptionColor('var(--text-muted)');
      setCompanyNameStyle('h1');
      setCompanyCaptionStyle('h3');
      setFooterPoweredByType('text');
      setFooterPoweredByText('Powered by OomniEye Digital Solutions');
      setFooterPoweredByImage('');
      setStartExpanded(false);
      setAutoHideSidebar(false);
      setExpandedWidth(260);
      setCollapsedWidth(68);
      setShowIcons(true);
      setShowLabels(true);
    }
  };

  // Save changes
  const handleSave = () => {
    isSavedRef.current = true;
    localStorage.setItem('gs_footerVisible', JSON.stringify(footerVisible));
    localStorage.setItem('gs_copyrightText', copyrightText);
    localStorage.setItem('gs_startExpanded', JSON.stringify(startExpanded));
    localStorage.setItem('sidebarCollapsed', JSON.stringify(!startExpanded));
    localStorage.setItem('gs_notificationsToShow', JSON.stringify(notificationsToShow));
    setSidebarAutoHide(autoHideSidebar);
    localStorage.setItem('gs_footerPoweredByType', JSON.stringify(footerPoweredByType));
    localStorage.setItem('gs_footerPoweredByText', footerPoweredByText);
    localStorage.setItem('gs_footerPoweredByImage', footerPoweredByImage);
    localStorage.setItem('gs_footerLinks', JSON.stringify(footerLinks));
    localStorage.setItem('gs_footerLinks', JSON.stringify(footerLinks));

    localStorage.setItem('gs_showCustomerProfile', JSON.stringify(showCustomerProfile));
    localStorage.setItem('gs_customerName', customerName);
    localStorage.setItem('gs_customerNameStyle', customerNameStyle);
    localStorage.setItem('gs_customerNameColor', customerNameColor);
    localStorage.setItem('gs_customerColorFollow', JSON.stringify(customerColorFollow));
    localStorage.setItem('gs_showCustomerLogo', JSON.stringify(showCustomerLogo));
    localStorage.setItem('gs_customerLogo', customerLogo);
    localStorage.setItem('gs_expandedWidth', JSON.stringify(expandedWidth));
    localStorage.setItem('gs_collapsedWidth', JSON.stringify(collapsedWidth));
    localStorage.setItem('gs_showIcons', JSON.stringify(showIcons));
    localStorage.setItem('gs_showLabels', JSON.stringify(showLabels));
    setSidebarExpandedWidth(expandedWidth);
    setSidebarCollapsedWidth(collapsedWidth);
    setSidebarShowIcons(showIcons);
    setSidebarShowLabels(showLabels);

    onSaveConfig({
      logo,
      showLogo,
      companyName,
      showCompanyName,
      companyCaption,
      showCompanyCaption,
      textColor,
      textColorApply,
      companyNameColor,
      companyCaptionColor,
      companyNameStyle,
      companyCaptionStyle,
      autoHideSidebar,
      startExpanded
    });
    onClose();
  };

  // Export settings to JSON
  const handleExportSettings = () => {
    const configToExport = {
      logo,
      showLogo,
      companyName,
      showCompanyName,
      companyCaption,
      showCompanyCaption,
      textColor,
      textColorApply,
      companyNameColor,
      companyCaptionColor
    };
    const blob = new Blob([JSON.stringify(configToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OomniEye_GlobalSettings_Export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import settings from JSON
  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const imported = JSON.parse(reader.result as string);
            if (imported.companyName !== undefined) {
              if (imported.logo !== undefined) setLogo(imported.logo);
              if (imported.showLogo !== undefined) setShowLogo(imported.showLogo);
              if (imported.companyName !== undefined) setCompanyName(imported.companyName);
              if (imported.showCompanyName !== undefined) setShowCompanyName(imported.showCompanyName);
              if (imported.companyCaption !== undefined) setCompanyCaption(imported.companyCaption);
              if (imported.showCompanyCaption !== undefined) setShowCompanyCaption(imported.showCompanyCaption);
              if (imported.textColor !== undefined) setTextColor(imported.textColor);
              if (imported.textColorApply !== undefined) setTextColorApply(imported.textColorApply);
              if (imported.companyNameColor !== undefined) setCompanyNameColor(imported.companyNameColor);
              if (imported.companyCaptionColor !== undefined) setCompanyCaptionColor(imported.companyCaptionColor);
              if (imported.companyNameStyle !== undefined) setCompanyNameStyle(imported.companyNameStyle);
              if (imported.companyCaptionStyle !== undefined) setCompanyCaptionStyle(imported.companyCaptionStyle);
              alert("Settings imported successfully. Click Save Settings to apply.");
            } else {
              alert("Invalid backup configuration file format.");
            }
          } catch (err) {
            alert("Error parsing backup settings file.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Close on Escape keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelAndClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCancelAndClose]);

  const navItems = [
    { id: 'header', label: 'Header', icon: <LayoutPanelTop size={16} /> },
    { id: 'profile', label: 'Customer Profile', icon: <Users size={16} /> },
    { id: 'footer', label: 'Footer', icon: <Layout size={16} /> },
    { id: 'sidebar', label: 'Sidebar', icon: <LayoutPanelLeft size={16} /> },
  ];

  return (
    <div className="gs-overlay" onClick={handleCancelAndClose}>
      <div className="gs-modal" onClick={e => e.stopPropagation()}>

        <ImageCropperModal 
          isOpen={isCropperOpen}
          imageUrl={pendingCropImage}
          onClose={() => setIsCropperOpen(false)}
          onConfirm={(croppedUrl) => {
            if (cropperTarget === 'header') {
              setLogo(croppedUrl);
            } else if (cropperTarget === 'footer') {
              setFooterPoweredByImage(croppedUrl);
            } else if (cropperTarget === 'customer') {
              setCustomerLogo(croppedUrl);
            }
            setIsCropperOpen(false);
          }}
        />

        {/* HEADER BAR */}
        <div className="gs-header">
          <div className="gs-header-left">
            <h2>
              <Settings size={20} style={{ color: 'var(--primary)' }} />
              Global Settings
            </h2>
          </div>
          <div className="gs-header-right">
            <button className="gs-icon-btn" title="Close" onClick={handleCancelAndClose} style={{ marginLeft: '8px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* TABS ROW */}
        <div className="gs-tabs-row">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabId)}
              className={`gs-tab-btn ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* CONTENT PANEL BODY */}
        <div className="gs-content-body">
          {activeTab === 'header' && (
            <div className="gs-tab-content-container">
              <div className="gs-cards-2x2">

                {/* Left Card: Logo Settings */}
                <div className="gs-config-card gs-card-blue">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Image size={18} />
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>Logo Settings <span title="Configure the primary logo displayed in the top-left corner" style={{ display: 'inline-flex' }}><Info size={14} style={{ color: 'var(--text-muted)', cursor: 'help' }} /></span></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    {/* Dashed upload area */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ 
                        border: '1px dashed var(--text-muted)', 
                        borderRadius: '12px', 
                        padding: '20px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg-dashboard)',
                        transition: 'all 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-dashboard)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-dashboard)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>
                        <Upload size={16} /> Choose image
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />

                    {/* Uploaded image preview */}
                    {logo && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={logo} alt="Uploaded Preview" style={{ height: '36px', width: '36px', objectFit: 'contain', borderRadius: '4px' }} />
                          <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Uploaded image</span>
                        </div>
                        <button type="button" onClick={() => {
                          setLogo('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={18} color="var(--text-muted)" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Show Logo toggle at the bottom */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>Show Logo</span>
                    </div>
                    <AppleToggle checked={showLogo} onChange={setShowLogo} />
                  </div>
                </div>

                {/* Right Card: Branding Texts */}
                <div className="gs-config-card gs-card-green">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Type size={18} />
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>Branding Texts <span title="Configure the text displayed in the header" style={{ display: 'inline-flex' }}><Info size={14} style={{ color: 'var(--text-muted)', cursor: 'help' }} /></span></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {/* Company Name Block */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Controls Row */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {/* Font Style */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Style</span>
                            <select
                              value={companyNameStyle}
                              onChange={(e) => setCompanyNameStyle(e.target.value)}
                              style={{
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-hover)',
                                fontSize: '12px',
                                padding: '0 4px',
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="h1">H1</option>
                              <option value="h2">H2</option>
                              <option value="h3">H3</option>
                              <option value="h4">H4</option>
                              <option value="h5">H5</option>
                              <option value="h6">H6</option>
                            </select>
                          </div>
                          {/* Color Picker */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Color</span>
                            <div style={{ position: 'relative' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  backgroundColor: companyNameColor,
                                  border: '1px solid var(--border-hover)',
                                  cursor: 'pointer',
                                }}
                                onClick={() => document.getElementById('gs-color-picker-name')?.click()}
                              />
                              <input
                                id="gs-color-picker-name"
                                type="color"
                                value={companyNameColor}
                                onChange={(e) => setCompanyNameColor(e.target.value)}
                                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                              />
                            </div>
                          </div>
                        </div>
                        {/* Toggle */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Show</span>
                          <AppleToggle checked={showCompanyName} onChange={setShowCompanyName} />
                        </div>
                      </div>

                      {/* Input Box */}
                      <div style={{ position: 'relative', marginTop: '6px' }}>
                        <span style={{ 
                          position: 'absolute', 
                          top: '-8px', 
                          left: '12px', 
                          background: '#e8eefb', 
                          padding: '0 4px', 
                          fontSize: '11px', 
                          color: 'var(--text-secondary)',
                          fontWeight: 500
                        }}>
                          Company Name
                        </span>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. OomniEye"
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-hover)',
                            fontSize: '14px',
                            outline: 'none',
                            color: 'var(--text-main)',
                            backgroundColor: 'var(--bg-card)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Company Caption Block */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                      {/* Controls Row */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {/* Font Style */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Style</span>
                            <select
                              value={companyCaptionStyle}
                              onChange={(e) => setCompanyCaptionStyle(e.target.value)}
                              style={{
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-hover)',
                                fontSize: '12px',
                                padding: '0 4px',
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="h1">H1</option>
                              <option value="h2">H2</option>
                              <option value="h3">H3</option>
                              <option value="h4">H4</option>
                              <option value="h5">H5</option>
                              <option value="h6">H6</option>
                            </select>
                          </div>
                          {/* Color Picker */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Color</span>
                            <div style={{ position: 'relative' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  backgroundColor: companyCaptionColor,
                                  border: '1px solid var(--border-hover)',
                                  cursor: 'pointer',
                                }}
                                onClick={() => document.getElementById('gs-color-picker-caption')?.click()}
                              />
                              <input
                                id="gs-color-picker-caption"
                                type="color"
                                value={companyCaptionColor}
                                onChange={(e) => setCompanyCaptionColor(e.target.value)}
                                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                              />
                            </div>
                          </div>
                        </div>
                        {/* Toggle */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Show</span>
                          <AppleToggle checked={showCompanyCaption} onChange={setShowCompanyCaption} />
                        </div>
                      </div>

                      {/* Input Box */}
                      <div style={{ position: 'relative', marginTop: '6px' }}>
                        <span style={{ 
                          position: 'absolute', 
                          top: '-8px', 
                          left: '12px', 
                          background: '#e8eefb', 
                          padding: '0 4px', 
                          fontSize: '11px', 
                          color: 'var(--text-secondary)',
                          fontWeight: 500
                        }}>
                          Company Caption
                        </span>
                        <input
                          type="text"
                          value={companyCaption}
                          onChange={(e) => setCompanyCaption(e.target.value)}
                          placeholder="e.g. Digital Twin Solutions"
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-hover)',
                            fontSize: '14px',
                            outline: 'none',
                            color: 'var(--text-main)',
                            backgroundColor: 'var(--bg-card)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="gs-tab-content-container">
              <div className="gs-cards-2x2">
                <div className="gs-config-card gs-card-blue">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Star size={16} fill="currentColor" />
                    </div>
                    <label style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Powered By
                      <span title="Custom branding text or logo in footer bottom-right" style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <Info size={12} style={{ opacity: 0.6, cursor: 'help' }} />
                      </span>
                    </label>
                  </div>

                  {/* Tabs: Text vs Image */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '0' }}>
                    <button
                      type="button"
                      onClick={() => setFooterPoweredByType('text')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: footerPoweredByType === 'text' ? 'none' : '1px solid var(--primary)',
                        backgroundColor: footerPoweredByType === 'text' ? '#0b57d0' : 'transparent',
                        color: footerPoweredByType === 'text' ? 'var(--bg-card)' : 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.05s ease'
                      }}
                    >
                      <Type size={14} /> TEXT
                    </button>
                    <button
                      type="button"
                      onClick={() => setFooterPoweredByType('image')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: footerPoweredByType === 'image' ? 'none' : '1px solid var(--primary)',
                        backgroundColor: footerPoweredByType === 'image' ? '#0b57d0' : 'transparent',
                        color: footerPoweredByType === 'image' ? 'var(--bg-card)' : 'var(--primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.05s ease'
                      }}
                    >
                      <Image size={14} /> IMAGE
                    </button>
                  </div>

                  {/* Dynamic Inputs */}
                  {footerPoweredByType === 'text' ? (
                    <div style={{ position: 'relative', marginTop: '8px', width: '100%' }}>
                      <span style={{ 
                        position: 'absolute', 
                        top: '-8px', 
                        left: '12px', 
                        background: '#f0f4ff', 
                        padding: '0 4px', 
                        fontSize: '11px', 
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                      }}>
                        Powered By Text
                      </span>
                      <input 
                        type="text" 
                        value={footerPoweredByText}
                        onChange={(e) => setFooterPoweredByText(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-hover)',
                          fontSize: '14px',
                          outline: 'none',
                          color: 'var(--text-main)',
                          backgroundColor: 'var(--bg-card)'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        Displayed in the footer bottom-right
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, marginTop: '12px' }}>
                      {/* Dashed upload area */}
                      <div 
                        onClick={() => footerFileInputRef.current?.click()}
                        style={{ 
                          border: '1px dashed var(--text-muted)', 
                          borderRadius: '12px', 
                          padding: '20px', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: 'var(--bg-dashboard)',
                          transition: 'all 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-dashboard)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-dashboard)')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>
                          <Upload size={16} /> Choose image
                        </div>
                      </div>
                      <input
                        ref={footerFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFooterImageUpload}
                        style={{ display: 'none' }}
                      />

                      {/* Uploaded image preview */}
                      {footerPoweredByImage && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={footerPoweredByImage} alt="Uploaded Preview" style={{ height: '36px', width: '36px', objectFit: 'contain', borderRadius: '4px' }} />
                            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Uploaded image</span>
                          </div>
                          <button type="button" onClick={() => {
                            setFooterPoweredByImage('');
                            if (footerFileInputRef.current) footerFileInputRef.current.value = '';
                          }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={18} color="var(--text-muted)" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="gs-config-card gs-card-green">
                  
                  {/* Row 1: Footer Visibility */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Eye size={18} />
                      </div>
                      <label style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>Footer Visibility <span title="Toggle whether the footer bar is visible" style={{ display: 'inline-flex' }}><Info size={14} style={{ color: 'var(--text-muted)', cursor: 'help' }} /></span></label>
                    </div>
                    <AppleToggle checked={footerVisible} onChange={setFooterVisible} />
                  </div>

                  <div style={{ borderBottom: '1px solid var(--bg-dashboard)', margin: '4px 0' }} />

                  {/* Row 2: Copyright Text */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Check size={18} />
                    </div>
                    <div style={{ flex: 1, position: 'relative', marginTop: '8px' }}>
                      <span style={{ 
                        position: 'absolute', 
                        top: '-8px', 
                        left: '12px', 
                        background: '#e8eefb', 
                        padding: '0 4px', 
                        fontSize: '11px', 
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                      }}>
                        Copyright Text
                      </span>
                      <input 
                        type="text" 
                        value={copyrightText} 
                        onChange={(e) => setCopyrightText(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-hover)',
                          fontSize: '14px',
                          outline: 'none',
                          color: 'var(--text-main)',
                          backgroundColor: 'var(--bg-card)'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px solid var(--bg-dashboard)', margin: '4px 0' }} />

                  {/* Row 3: Add Footer Link */}
                  <div style={{ 
                    position: 'relative', 
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden'
                  }}>
                    {/* State A: Add Link Trigger */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: isAddingLink ? 0 : 1,
                      transform: isAddingLink ? 'translateX(-20px)' : 'translateX(0)',
                      pointerEvents: isAddingLink ? 'none' : 'auto',
                      transition: 'all 0.05s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(37, 99, 235, 0.1)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Plus size={18} />
                        </div>
                        <label style={{ fontSize: '13.5px', color: '#1e293b', fontWeight: 700 }}>Add Footer Link</label>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsAddingLink(true)}
                        style={{
                          padding: '6px 16px',
                          background: 'var(--btn-color)', color: 'var(--btn-text)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.05s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--primary)'}
                      >
                        ADD LINK
                      </button>
                    </div>

                    {/* State B: Animated Inline Inputs */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: isAddingLink ? 1 : 0,
                      transform: isAddingLink ? 'translateX(0)' : 'translateX(20px)',
                      pointerEvents: isAddingLink ? 'auto' : 'none',
                      transition: 'all 0.05s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}>
                      <input 
                        type="text" 
                        placeholder="Link Label" 
                        value={linkText}
                        onChange={e => setLinkText(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-hover)',
                          fontSize: '14px',
                          color: 'var(--text-main)',
                          backgroundColor: 'var(--bg-card)',
                          outline: 'none',
                          minWidth: 0
                        }}
                      />
                      <input 
                        type="text" 
                        placeholder="Link URL" 
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        style={{
                          flex: 1.5,
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-hover)',
                          fontSize: '14px',
                          color: 'var(--text-main)',
                          backgroundColor: 'var(--bg-card)',
                          outline: 'none',
                          minWidth: 0
                        }}
                      />
                      {/* Confirm Icon Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (linkText && linkUrl) {
                            setFooterLinks(prev => [...prev, `${linkText} (${linkUrl})`]);
                            setLinkText('');
                            setLinkUrl('');
                            setIsAddingLink(false);
                          } else {
                            alert('Please enter both a label and a URL.');
                          }
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--success)',
                          color: 'var(--on-accent)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      {/* Cancel Icon Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setLinkText('');
                          setLinkUrl('');
                          setIsAddingLink(false);
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--danger)',
                          color: 'var(--on-accent)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Added Links List inline in the first card */}
                  {footerLinks.length > 0 && (
                    <div className="no-scrollbar" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', overflowY: 'auto', maxHeight: '70px', paddingRight: '4px' }}>
                      {footerLinks.map((link, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dashboard)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
                          <button type="button" onClick={() => setFooterLinks(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>



              </div>
            </div>
          )}

          {/* Sidebar Config Panel */}
          {activeTab === 'sidebar' && (
            <div className="gs-tab-content-container">
              <div className="gs-cards-2x2">
                
                {/* Behavior Card */}
                <div className="gs-config-card gs-card-blue">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <LayoutPanelLeft size={18} />
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>Behavior <span title="Configure how the sidebar behaves" style={{ display: 'inline-flex' }}><Info size={14} style={{ color: 'var(--text-muted)', cursor: 'help' }} /></span></span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Start Expanded</span>
                      <AppleToggle checked={startExpanded} onChange={setStartExpanded} />
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', margin: '-4px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Automatically Hide Sidebar</span>
                        <span title="Hides sidebar automatically when cursor leaves the area, expanding it on hover." style={{ display: 'inline-flex' }}>
                          <Info size={14} color="var(--text-muted)" style={{ cursor: 'help' }} />
                        </span>
                      </div>
                      <AppleToggle checked={autoHideSidebar} onChange={setAutoHideSidebar} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Show Icons</span>
                      <AppleToggle checked={showIcons} onChange={setShowIcons} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Show Labels</span>
                      <AppleToggle checked={showLabels} onChange={setShowLabels} />
                    </div>
                  </div>
                </div>

                {/* Width Configuration Card */}
                <div 
                  className="gs-config-card gs-card-green"
                >
                  {/* Expanded Width */}
                  <div
                    onMouseEnter={() => setIsHoveringExpanded(true)}
                    onMouseLeave={() => setIsHoveringExpanded(false)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.12)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Plus size={18} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>Expanded Width</span>
                      <span title="Recommended range: 180-300 pixels" style={{ display: 'inline-flex' }}>
                        <Info size={14} color="var(--text-muted)" style={{ cursor: 'help' }} />
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>Width: {expandedWidth}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="180" 
                      max="300" 
                      value={expandedWidth} 
                      onChange={e => setExpandedWidth(Number(e.target.value))} 
                      onPointerDown={() => setIsDraggingExpanded(true)}
                      onPointerUp={() => setIsDraggingExpanded(false)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                  </div>
                  
                  {/* Collapsed Width */}
                  <div
                    onMouseEnter={() => setIsHoveringCollapsed(true)}
                    onMouseLeave={() => setIsHoveringCollapsed(false)}
                    style={{ marginTop: '16px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Eye size={18} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>Collapsed Width</span>
                      <span title="Recommended: 64 pixels for optimal icon spacing" style={{ display: 'inline-flex' }}>
                        <Info size={14} color="var(--text-muted)" style={{ cursor: 'help' }} />
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span>Width: {collapsedWidth}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="90" 
                      value={collapsedWidth} 
                      onChange={e => setCollapsedWidth(Number(e.target.value))} 
                      onPointerDown={() => setIsDraggingCollapsed(true)}
                      onPointerUp={() => setIsDraggingCollapsed(false)}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                  </div>
                </div>

              </div>
            </div>
          )}



          {/* Customer Profile Config Panel */}
          {activeTab === 'profile' && (
            <div className="gs-tab-content-container">
              <div className="gs-cards-2x2">
                
                {/* Left Card: Customer Logo */}
                <div className="gs-config-card gs-card-blue">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Image size={18} />
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>Customer Logo <span title="Configure the customer logo displayed in the center of the header" style={{ display: 'inline-flex' }}><Info size={14} style={{ color: 'var(--text-muted)', cursor: 'help' }} /></span></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    {/* Dashed upload area */}
                    <div 
                      onClick={() => customerLogoInputRef.current?.click()}
                      style={{ 
                        border: '1px dashed var(--text-muted)', 
                        borderRadius: '12px', 
                        padding: '20px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg-dashboard)',
                        transition: 'all 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-dashboard)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-dashboard)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>
                        <Upload size={16} /> Choose image
                      </div>
                    </div>
                    <input
                      ref={customerLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomerLogoUpload}
                      style={{ display: 'none' }}
                    />

                    {/* Uploaded image preview */}
                    {customerLogo && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', borderRadius: '12px', padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={customerLogo} alt="Uploaded Preview" style={{ height: '36px', width: '36px', objectFit: 'contain', borderRadius: '4px' }} />
                          <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>Uploaded image</span>
                        </div>
                        <button type="button" onClick={() => {
                          setCustomerLogo('');
                          if (customerLogoInputRef.current) customerLogoInputRef.current.value = '';
                        }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={18} color="var(--text-muted)" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Show Logo toggle at the bottom */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>Show Logo</span>
                    </div>
                    <AppleToggle checked={showCustomerLogo} onChange={setShowCustomerLogo} />
                  </div>
                </div>

                <div className="gs-config-card gs-card-green">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Type size={18} />
                    </div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>Customer Profile Visibility <span title="Toggle whether the customer profile is visible in the header" style={{ display: 'inline-flex' }}><Info size={14} style={{ color: 'var(--text-muted)', cursor: 'help' }} /></span></span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Controls Row */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {/* Font Style */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Style</span>
                            <select
                              value={customerNameStyle}
                              onChange={(e) => setCustomerNameStyle(e.target.value)}
                              style={{
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-hover)',
                                fontSize: '12px',
                                padding: '0 4px',
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="h1">H1</option>
                              <option value="h2">H2</option>
                              <option value="h3">H3</option>
                              <option value="h4">H4</option>
                              <option value="h5">H5</option>
                              <option value="h6">H6</option>
                            </select>
                          </div>
                          {/* Color Picker */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>Color</span>
                            <div style={{ position: 'relative' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  backgroundColor: customerNameColor,
                                  border: '1px solid var(--border-hover)',
                                  cursor: 'pointer',
                                }}
                                onClick={() => document.getElementById('gs-color-picker-customer')?.click()}
                              />
                              <input
                                id="gs-color-picker-customer"
                                type="color"
                                value={customerNameColor}
                                onChange={(e) => setCustomerNameColor(e.target.value)}
                                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, top: 0, left: 0 }}
                              />
                            </div>
                          </div>
                        </div>
                        {/* Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <AppleToggle checked={showCustomerProfile} onChange={setShowCustomerProfile} />
                        </div>
                      </div>

                      {/* Input Box */}
                      <div style={{ position: 'relative', marginTop: '20px' }}>
                        <span style={{ 
                          position: 'absolute', 
                          top: '-8px', 
                          left: '12px', 
                          background: '#e8eefb', 
                          padding: '0 4px', 
                          fontSize: '11px', 
                          color: 'var(--text-secondary)',
                          fontWeight: 600
                        }}>
                          Customer Name
                        </span>
                        <input 
                          type="text" 
                          value={customerName} 
                          onChange={e => setCustomerName(e.target.value)} 
                          placeholder="Customer Name"
                          style={{ 
                            width: '100%', 
                            padding: '10px 12px', 
                            borderRadius: '10px', 
                            border: '1px solid var(--border-hover)', 
                            fontSize: '14px', 
                            outline: 'none', 
                            color: 'var(--text-main)', 
                            backgroundColor: 'var(--bg-card)' 
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '16px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Text Color matches theme</span>
                      <AppleToggle checked={customerColorFollow} onChange={setCustomerColorFollow} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}



        </div>

        {/* BOTTOM STICKY FOOTER */}
        <div className="gs-footer">
          <div style={{ flex: 1 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button 
                className="gs-icon-btn" 
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                onBlur={() => setTimeout(() => setIsMoreMenuOpen(false), 200)}
              >
                <MoreVertical size={18} />
              </button>
              {isMoreMenuOpen && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                  padding: '4px',
                  display: 'flex',
                  gap: '4px',
                  zIndex: 50
                }}>
                  <button className="gs-icon-btn" title="Export Settings" onClick={handleExportSettings}>
                    <Download size={18} />
                  </button>
                  <button className="gs-icon-btn" title="Import Settings" onClick={handleImportSettings}>
                    <Upload size={18} />
                  </button>
                  <button className="gs-icon-btn" title="Reset to defaults" onClick={handleResetToDefaults}>
                    <RotateCcw size={18} color="var(--danger)" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="gs-footer-right">
            <button className="gs-btn-cancel" onClick={handleCancelAndClose}>
              Cancel
            </button>
            <button className="gs-btn-save" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
