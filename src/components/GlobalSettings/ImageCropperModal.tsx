import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (croppedDataUrl: string) => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  cropShape?: 'round' | 'rect';
  cropWidth?: number;
  cropHeight?: number;
}

export function ImageCropperModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  imageUrl,
  title = "Adjust image",
  subtitle = "Drag and zoom to fit your picture inside the bright frame. Anything in the dimmed area is cropped out.",
  cropShape = "round",
  cropWidth = 180,
  cropHeight = 180
}: ImageCropperModalProps) {
  const [zoomLevel, setZoomLevel] = useState(0); // -100 to 100
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    if (!imageRef.current || !containerRef.current) return;
    
    // Crop box dimensions
    const cWidth = cropWidth;
    const cHeight = cropHeight;

    const canvas = document.createElement('canvas');
    canvas.width = cWidth;
    canvas.height = cHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale factor based on zoom slider (-100 to 100) -> 0.25x to 4x
    const scale = Math.pow(2, zoomLevel / 50);
    
    // Original image intrinsic dimensions
    const imgWidth = imageRef.current.naturalWidth;
    const imgHeight = imageRef.current.naturalHeight;
    
    // Calculate aspect-ratio fit base dimensions matching CSS object-fit: contain
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const baseScale = Math.min(scaleX, scaleY);
    
    const renderedWidth = imgWidth * baseScale;
    const renderedHeight = imgHeight * baseScale;
    
    // Center offset within container
    const offsetX = (containerWidth - renderedWidth) / 2;
    const offsetY = (containerHeight - renderedHeight) / 2;

    // Crop box coordinates in container space
    const cropBoxX = (containerWidth - cWidth) / 2;
    const cropBoxY = (containerHeight - cHeight) / 2;

    // Transform logic matching CSS
    ctx.translate(cWidth / 2, cHeight / 2);

    if (cropShape === 'round') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(cWidth, cHeight) / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.scale(scale, scale);
    ctx.translate(position.x / scale, position.y / scale);
    
    // Draw the image relative to the center of the crop box
    const drawX = offsetX - cropBoxX - cWidth / 2;
    const drawY = offsetY - cropBoxY - cHeight / 2;
    
    ctx.clearRect(-cWidth, -cHeight, cWidth * 2, cHeight * 2);
    ctx.drawImage(
      imageRef.current,
      drawX,
      drawY,
      renderedWidth,
      renderedHeight
    );

    const dataUrl = canvas.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '420px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-size-18)', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-13)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {subtitle}
          </p>
        </div>

        {/* Cropper Area */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{
            width: '100%',
            height: '240px',
            backgroundColor: 'var(--bg-dashboard)',
            backgroundImage: 'linear-gradient(45deg, var(--border-light) 25%, transparent 25%), linear-gradient(-45deg, var(--border-light) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--border-light) 75%), linear-gradient(-45deg, transparent 75%, var(--border-light) 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
        >
          {/* Actual Image */}
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt="Upload Preview" 
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            draggable={false}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `scale(${Math.pow(2, zoomLevel / 50)}) translate(${position.x / Math.pow(2, zoomLevel / 50)}px, ${position.y / Math.pow(2, zoomLevel / 50)}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out',
              pointerEvents: 'auto'
            }} 
          />
          
          {/* Dimmed Area overlay (bright frame cutout) */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${cropWidth}px`,
            height: `${cropHeight}px`,
            borderRadius: cropShape === 'round' ? '50%' : '12px',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Zoom Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
          <span style={{ fontSize: 'var(--font-size-14)', fontWeight: 700, color: 'var(--text-main)' }}>Zoom</span>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            value={zoomLevel} 
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button 
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '10px 18px' }}
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary"
            style={{ flex: 1, padding: '10px 18px' }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
