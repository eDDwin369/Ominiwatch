import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Settings,
  CheckCircle2
} from 'lucide-react';
import './Dashboard.css';

interface TemplateWelcomeProps {
  onNavigate?: (tab: string) => void;
  onSettingsClick?: () => void;
  productName?: string;
  stepGifs?: { [key: number]: string };
}

export function TemplateWelcome({
  onNavigate: _onNavigate, 
  onSettingsClick: _onSettingsClick, 
  productName: _productName = 'My Product',
  stepGifs: _stepGifs
}: TemplateWelcomeProps) {
  // Related Ventures data for Version 2 layout
  const venturesData = [
    {
      id: 'brand',
      prefix: 'Set up Your',
      highlight: 'Brand',
      gradientClass: 'v6-gradient-brand',
      title: 'Set up Your Brand',
      image: '/assets/venture_appliance.png'
    },
    {
      id: 'appearance',
      prefix: 'Customize Your',
      highlight: 'Appearance',
      gradientClass: 'v6-gradient-appearance',
      title: 'Customize Your Appearance',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop'
    },
    {
      id: 'content',
      prefix: 'Build Your',
      highlight: 'Content',
      gradientClass: 'v6-gradient-content',
      title: 'Build Your Content',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop'
    }
  ];

  const [activeVentureIndex, setActiveVentureIndex] = useState<number>(0);

  // Video player state
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(35);
  const [isAutoPlaying] = useState<boolean>(true);
  const [isVideoExpanded, setIsVideoExpanded] = useState<boolean>(false);
  const [isClosingCinema, setIsClosingCinema] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<string>('1.0x');

  // Exact YouTube Controls States from Screenshot
  const [isAutoplay, setIsAutoplay] = useState<boolean>(true);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [isMiniplayer, setIsMiniplayer] = useState<boolean>(false);

  // Completed Video Steps Tracking (Persisted in localStorage)
  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('twineye_completed_video_steps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const markCurrentStepCompleted = () => {
    const currentId = venturesData[activeVentureIndex]?.id;
    if (!currentId) return;
    setCompletedSteps(prev => {
      if (prev[currentId]) return prev;
      const updated = { ...prev, [currentId]: true };
      localStorage.setItem('twineye_completed_video_steps', JSON.stringify(updated));
      return updated;
    });
  };

  const handleOpenCinema = () => {
    setIsVideoExpanded(true);
    // Request native browser fullscreen if supported so it covers tabs & browser header
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleCloseCinema = () => {
    if (isClosingCinema) return;
    setIsClosingCinema(true);
    markCurrentStepCompleted();
    setTimeout(() => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsVideoExpanded(false);
      setIsClosingCinema(false);
    }, 350);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoExpanded) {
        handleCloseCinema();
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isVideoExpanded && !isClosingCinema) {
        setIsClosingCinema(true);
        setTimeout(() => {
          setIsVideoExpanded(false);
          setIsClosingCinema(false);
        }, 350);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isVideoExpanded, isClosingCinema]);

  // Ambient Particle Canvas Ref for Version 2
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Intro text sequence for Version 2 video screen ("Welcome to" -> "OmniEye")
  const [introTextIndex, setIntroTextIndex] = useState<number>(0);
  const introPhrases = ['Welcome to', 'OmniEye'];

  // Full Dashboard Pure Black Intro Screen State for Version 2 ("Welcome to" -> "OomniEye")
  const [showFullIntro, setShowFullIntro] = useState<boolean>(true);
  const [introPhase, setIntroPhase] = useState<'welcome' | 'omni'>('welcome');
  const [isIntroFadingOut, setIsIntroFadingOut] = useState<boolean>(false);

  const handleDismissIntro = () => {
    if (isIntroFadingOut) return;
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setIsIntroFadingOut(true);
    setTimeout(() => {
      setShowFullIntro(false);
    }, 800);
  };

  useEffect(() => {
    setShowFullIntro(true);
    setIntroPhase('welcome');
    setIsIntroFadingOut(false);

    // Request native browser fullscreen on user interaction to cover browser tabs & header
    const triggerNativeFullscreen = () => {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    window.addEventListener('click', triggerNativeFullscreen, { once: true });

    const timer1 = setTimeout(() => {
      setIntroPhase('omni');
    }, 2000);

    const timer2 = setTimeout(() => {
      setIsIntroFadingOut(true);
    }, 3800);

    const timer3 = setTimeout(() => {
      setShowFullIntro(false);
    }, 4600);

    return () => {
      window.removeEventListener('click', triggerNativeFullscreen);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIntroTextIndex(prev => (prev + 1) % introPhrases.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Video scrubbing simulation & step auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlayingVideo) {
      timer = setInterval(() => {
        setVideoProgress(prev => {
          if (prev >= 85) {
            markCurrentStepCompleted();
          }
          if (prev >= 100) {
            if (isAutoPlaying) {
              setActiveVentureIndex(current => (current >= venturesData.length - 1 ? 0 : current + 1));
            }
            return 0;
          }
          return prev + 1.5;
        });
      }, 450);
    }
    return () => clearInterval(timer);
  }, [isPlayingVideo, isAutoPlaying, activeVentureIndex, venturesData]);

  // Canvas particle wave animation for Version 2 background
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const numParticles = 45;
    const particles = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.25 + 0.08
    }));

    let step = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      step += 0.015;

      particles.forEach((p, i) => {
        p.x += p.vx + Math.sin(step + i) * 0.3;
        p.y += p.vy + Math.cos(step + i * 0.5) * 0.2;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.25})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Fixed Full Screen Black Intro Overlay for Version 2 (Rendered at document.body level to prevent sidebar clipping) */}
      {showFullIntro && typeof document !== 'undefined' && document.body && createPortal(
        <div 
          className={`v2-full-dashboard-intro-overlay ${introPhase === 'omni' ? 'phase-omni' : 'phase-welcome'} ${isIntroFadingOut ? 'intro-fade-out' : ''}`}
          onClick={handleDismissIntro}
          title="Click anywhere to skip intro"
        >
          <div className="v2-sonar-ring ring-1" />
          <div className="v2-sonar-ring ring-2" />
          <div className="v2-sonar-ring ring-3" />

          <div key={introPhase} className={`v2-full-intro-text ${introPhase === 'welcome' ? 'text-welcome' : 'text-omni'}`}>
            {introPhase === 'welcome' ? 'Welcome to' : 'OomniEye'}
          </div>

          <div className="v2-skip-intro-hint">Click anywhere to enter full screen ⤢</div>
        </div>,
        document.body
      )}

      <div className={`dash-layout-container dashboard-fade-in mode-v2 v2-active-${venturesData[activeVentureIndex].id}`}>

      {/* Top Header Row */}
      <div className="dash-top-header-row">
        <div className="dash-header-left">
          <div className="dash-breadcrumb-bar anim-header-entry">
            <h3 className="dash-breadcrumb-text">
              <span className="v6-dashboard-title">Dashboard</span>
            </h3>
          </div>
        </div>
      </div>

      {/* ==================== VERSION 2: Executive Minimal Ice Blue Card Layout ==================== */}
      <div className="v2-ice-full-container">
        {/* Ambient Particle Animation Layer */}
        <div className="ambient-particles-layer" aria-hidden="true">
          <canvas ref={particleCanvasRef} className="v2-bottom-particle-wave-canvas" />
          <div className="particle-orb orb-1" />
          <div className="particle-orb orb-2" />
          <div className="particle-orb orb-3" />
          <div className="particle-orb orb-4" />
          <div className="particle-orb orb-5" />
          <div className="particle-orb orb-6" />
          <div className="particle-orb orb-7" />
          <div className="particle-orb orb-8" />
        </div>

        <div className="v2-ice-card">
          <div className="v6-ventures-body">
            {/* Left Column: Venture Titles */}
            <div className="v6-ventures-left">
              {/* Prefix line above */}
              <div className="v2-prefix-line">
                {venturesData[activeVentureIndex].prefix}
              </div>

              {/* Step highlights list below */}
              <div className="v6-highlight-list">
                {venturesData.map((venture, idx) => {
                  const isCompleted = !!completedSteps[venture.id];
                  return (
                    <div
                      key={venture.id}
                      className={`v2-highlight-item ${idx === activeVentureIndex ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      onClick={() => setActiveVentureIndex(idx)}
                    >
                      <span className={`v2-text-span ${venture.gradientClass}`}>
                        {venture.highlight}
                      </span>
                      {isCompleted && (
                        <span className="v2-completed-tick-badge" title="Video watching completed">
                          <CheckCircle2 size={22} className="v2-completed-tick-icon" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Rectangular Video Player Placeholder */}
            <div className="v5-ventures-right">
              <div className="v5-video-player-container">
                {/* Rectangular Video Frame */}
                <div className="v5-video-screen">
                  {/* Intro Animated Text Overlay with Sonar Rings */}
                  <div className="v2-intro-animated-text-stage" aria-hidden="true">
                    <div className="v2-sonar-ring ring-1" />
                    <div className="v2-sonar-ring ring-2" />
                    <div className="v2-sonar-ring ring-3" />
                    
                    <div key={introTextIndex} className="v2-intro-text-anim-item">
                      {introPhrases[introTextIndex]}
                    </div>
                  </div>

                  <img 
                    src={venturesData[activeVentureIndex].image} 
                    alt={venturesData[activeVentureIndex].title}
                    className="v5-video-poster v5-anim-fade-img"
                    key={venturesData[activeVentureIndex].id}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/venture_appliance.png';
                    }}
                  />

                  {/* Dark Vignette Overlay */}
                  <div className="v5-video-overlay-gradient" />



                  {/* Center Glass Play/Pause Button */}
                  <button 
                    className="v5-center-play-btn"
                    onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                    title={isPlayingVideo ? "Pause Video" : "Play Video"}
                  >
                    {isPlayingVideo ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 3 }} />}
                  </button>

                  {/* YouTube Style Media Controls Bar */}
                  <div className="v5-yt-controls-container">
                    {/* YouTube Red Scrubber Track */}
                    <div 
                      className="v5-yt-progress-area"
                      title="Click to scrub"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const newPct = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
                        setVideoProgress(newPct);
                      }}
                    >
                      <div className="v5-yt-progress-bg">
                        <div className="v5-yt-progress-fill" style={{ width: `${videoProgress}%` }}>
                          <div className="v5-yt-scrub-handle" />
                        </div>
                      </div>
                    </div>

                    {/* YouTube Controls Row */}
                    <div className="v5-yt-controls-row">
                      {/* Left Controls Group (Play, Volume, Time 0:21 / 0:45) */}
                      <div className="v5-yt-left-group">
                        <button 
                          className="v5-yt-btn"
                          onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                          title={isPlayingVideo ? "Pause (k)" : "Play (k)"}
                        >
                          {isPlayingVideo ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" style={{ marginLeft: 2 }} />}
                        </button>

                        <div className="v5-yt-volume-group">
                          <button 
                            className="v5-yt-btn"
                            onClick={() => setIsMuted(!isMuted)}
                            title={isMuted ? "Unmute (m)" : "Mute (m)"}
                          >
                            {isMuted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
                          </button>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                              setVolume(Number(e.target.value));
                              if (Number(e.target.value) > 0) setIsMuted(false);
                            }}
                            className="v5-yt-volume-slider"
                            title="Volume"
                          />
                        </div>

                        <div className="v5-yt-time">
                          <span>{`0:${Math.floor((videoProgress / 100) * 45).toString().padStart(2, '0')} / 0:45`}</span>
                        </div>
                      </div>

                      {/* Right Controls Group (Autoplay, CC, Gear + Red HD Badge, Miniplayer, Expand) */}
                      <div className="v5-yt-right-group">
                        {/* Autoplay Switch Toggle */}
                        <button 
                          className={`v5-yt-autoplay-btn ${isAutoplay ? 'active' : ''}`}
                          onClick={() => setIsAutoplay(!isAutoplay)}
                          title={isAutoplay ? "Autoplay is on" : "Autoplay is off"}
                        >
                          <div className="v5-yt-autoplay-track">
                            <div className="v5-yt-autoplay-thumb">
                              <Play size={8} fill="currentColor" />
                            </div>
                          </div>
                        </button>

                        {/* Subtitles / CC Button */}
                        <button 
                          className={`v5-yt-cc-btn ${showSubtitles ? 'active' : ''}`}
                          onClick={() => setShowSubtitles(!showSubtitles)}
                          title="Subtitles/closed captions (c)"
                        >
                          <span>CC</span>
                        </button>

                        {/* Settings Gear with Red HD Quality Badge */}
                        <div style={{ position: 'relative' }}>
                          <button 
                            className="v5-yt-btn v5-yt-gear-btn"
                            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                            title="Settings"
                          >
                            <Settings size={18} style={{ transform: showSettingsMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
                            <span className="v5-yt-hd-red-badge">HD</span>
                          </button>

                          {showSettingsMenu && (
                            <div className="v5-yt-settings-popup">
                              <div className="v5-yt-settings-header">Speed: {playbackSpeed}</div>
                              {['0.5x', '1.0x', '1.5x', '2.0x'].map((speed) => (
                                <button
                                  key={speed}
                                  className={`v5-yt-settings-item ${playbackSpeed === speed ? 'active' : ''}`}
                                  onClick={() => {
                                    setPlaybackSpeed(speed);
                                    setShowSettingsMenu(false);
                                  }}
                                >
                                  {speed} {playbackSpeed === speed ? '✓' : ''}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Miniplayer / Embed Layout Button */}
                        <button 
                          className="v5-yt-cc-btn v5-yt-embed-btn"
                          onClick={() => setIsMiniplayer(!isMiniplayer)}
                          title="Miniplayer (i)"
                        >
                          <span style={{ fontSize: 10, letterSpacing: -1, fontWeight: 700 }}>&lt;/&gt;</span>
                        </button>

                        {/* Fullscreen / Expand Toggle */}
                        <button 
                          className="v5-yt-btn v5-yt-expand-btn"
                          onClick={handleOpenCinema}
                          title="Fullscreen (f)"
                        >
                          <Maximize2 size={19} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Step Navigation Arrows & Dots */}
                <div className="v5-player-footer-row">
                  <button 
                    className="v5-nav-btn"
                    onClick={() => setActiveVentureIndex(prev => (prev <= 0 ? venturesData.length - 1 : prev - 1))}
                    title="Previous Step"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="v5-carousel-dots">
                    {venturesData.map((_, idx) => (
                      <span
                        key={idx}
                        className={`v5-dot ${idx === activeVentureIndex ? 'active' : ''}`}
                        onClick={() => setActiveVentureIndex(idx)}
                      />
                    ))}
                  </div>

                  <button 
                    className="v5-nav-btn"
                    onClick={() => setActiveVentureIndex(prev => (prev >= venturesData.length - 1 ? 0 : prev + 1))}
                    title="Next Step"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Cinema 16:9 Lightbox Modal Portal when expanded */}
    {isVideoExpanded && createPortal(
      <div 
        className={`v5-cinema-overlay-backdrop ${isClosingCinema ? 'v5-cinema-closing' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseCinema();
        }}
      >
        <div className="v5-cinema-video-frame">
          {/* Intro Animated Text Overlay */}
          <div className="v2-intro-animated-text-stage" aria-hidden="true">
            <div className="v2-sonar-ring ring-1" />
            <div className="v2-sonar-ring ring-2" />
            <div className="v2-sonar-ring ring-3" />
            
            <div key={introTextIndex} className="v2-intro-text-anim-item">
              {introPhrases[introTextIndex]}
            </div>
          </div>

          <img 
            src={venturesData[activeVentureIndex].image} 
            alt={venturesData[activeVentureIndex].title}
            className="v5-video-poster v5-anim-fade-img"
            key={venturesData[activeVentureIndex].id}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/venture_appliance.png';
            }}
          />

          <div className="v5-video-overlay-gradient" />



          {/* Center Play/Pause Glass Button */}
          <button 
            className="v5-center-play-btn"
            onClick={() => setIsPlayingVideo(!isPlayingVideo)}
            title={isPlayingVideo ? "Pause" : "Play"}
          >
            {isPlayingVideo ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 3 }} />}
          </button>

          {/* YouTube Media Controls Bar */}
          <div className="v5-yt-controls-container">
            <div 
              className="v5-yt-progress-area"
              title="Click to scrub"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newPct = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
                setVideoProgress(newPct);
              }}
            >
              <div className="v5-yt-progress-bg">
                <div className="v5-yt-progress-fill" style={{ width: `${videoProgress}%` }}>
                  <div className="v5-yt-scrub-handle" />
                </div>
              </div>
            </div>

            <div className="v5-yt-controls-row">
              {/* Left Controls Group (Play, Volume, Time 0:21 / 0:45) */}
              <div className="v5-yt-left-group">
                <button 
                  className="v5-yt-btn"
                  onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                  title={isPlayingVideo ? "Pause (k)" : "Play (k)"}
                >
                  {isPlayingVideo ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" style={{ marginLeft: 2 }} />}
                </button>

                <div className="v5-yt-volume-group">
                  <button 
                    className="v5-yt-btn"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute (m)" : "Mute (m)"}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      if (Number(e.target.value) > 0) setIsMuted(false);
                    }}
                    className="v5-yt-volume-slider"
                    title="Volume"
                  />
                </div>

                <div className="v5-yt-time">
                  <span>{`0:${Math.floor((videoProgress / 100) * 45).toString().padStart(2, '0')} / 0:45`}</span>
                </div>
              </div>

              {/* Right Controls Group (Autoplay, CC, Gear + Red HD Badge, Miniplayer, Expand) */}
              <div className="v5-yt-right-group">
                {/* Autoplay Switch Toggle */}
                <button 
                  className={`v5-yt-autoplay-btn ${isAutoplay ? 'active' : ''}`}
                  onClick={() => setIsAutoplay(!isAutoplay)}
                  title={isAutoplay ? "Autoplay is on" : "Autoplay is off"}
                >
                  <div className="v5-yt-autoplay-track">
                    <div className="v5-yt-autoplay-thumb">
                      <Play size={8} fill="currentColor" />
                    </div>
                  </div>
                </button>

                {/* Subtitles / CC Button */}
                <button 
                  className={`v5-yt-cc-btn ${showSubtitles ? 'active' : ''}`}
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  title="Subtitles/closed captions (c)"
                >
                  <span>CC</span>
                </button>

                {/* Settings Gear with Red HD Quality Badge */}
                <div style={{ position: 'relative' }}>
                  <button 
                    className="v5-yt-btn v5-yt-gear-btn"
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    title="Settings"
                  >
                    <Settings size={18} style={{ transform: showSettingsMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
                    <span className="v5-yt-hd-red-badge">HD</span>
                  </button>

                  {showSettingsMenu && (
                    <div className="v5-yt-settings-popup">
                      <div className="v5-yt-settings-header">Speed: {playbackSpeed}</div>
                      {['0.5x', '1.0x', '1.5x', '2.0x'].map((speed) => (
                        <button
                          key={speed}
                          className={`v5-yt-settings-item ${playbackSpeed === speed ? 'active' : ''}`}
                          onClick={() => {
                            setPlaybackSpeed(speed);
                            setShowSettingsMenu(false);
                          }}
                        >
                          {speed} {playbackSpeed === speed ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Miniplayer / Embed Layout Button */}
                <button 
                  className="v5-yt-cc-btn v5-yt-embed-btn"
                  onClick={() => setIsMiniplayer(!isMiniplayer)}
                  title="Miniplayer (i)"
                >
                  <span style={{ fontSize: 10, letterSpacing: -1, fontWeight: 700 }}>&lt;/&gt;</span>
                </button>

                {/* Fullscreen / Expand Toggle */}
                <button 
                  className="v5-yt-btn v5-yt-expand-btn"
                  onClick={handleCloseCinema}
                  title="Exit Fullscreen"
                >
                  <Minimize2 size={19} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}

export default TemplateWelcome;
