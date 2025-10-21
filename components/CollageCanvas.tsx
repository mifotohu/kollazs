import React, { useRef, useMemo, useState, useLayoutEffect, useCallback } from 'react';
import type { UploadedImage, ImageTransform, CollageLayout, AspectRatio } from '../types';
import { calculateLayout } from '../services/layoutService';

interface CollageCanvasProps {
  images: UploadedImage[];
  imageTransforms: ImageTransform[];
  layout: CollageLayout;
  backgroundColor: string;
  spacing: number;
  cornerRadius: number;
  aspectRatio: AspectRatio;
  canvasRef: React.RefObject<HTMLDivElement>;
  activeImageIndex: number | null;
  onImageClick: (index: number) => void;
  onImageTransformChange: (transform: ImageTransform) => void; // Added for interactive changes
}

const CollageCanvas: React.FC<CollageCanvasProps> = ({
  images,
  imageTransforms,
  layout,
  backgroundColor,
  spacing,
  cornerRadius,
  aspectRatio,
  canvasRef,
  activeImageIndex,
  onImageClick,
  onImageTransformChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // State for interactive dragging/zooming
  const [isDragging, setIsDragging] = useState(false);
  // Stores the imageTransform.pan values when a drag starts
  const startPanTransform = useRef<{ x: number; y: number } | null>(null);
  // Stores the mouse/touch client coordinates when a drag starts
  const startMousePos = useRef<{ x: number; y: number } | null>(null);
  // To store index of image currently being dragged
  const activeDragImageRef = useRef<number | null>(null); 

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { canvasStyle, layoutWidth, layoutHeight } = useMemo(() => {
    if (!containerSize.width || !containerSize.height) {
      return { canvasStyle: {}, layoutWidth: 0, layoutHeight: 0 };
    }

    if (aspectRatio === 'free') {
      const style: React.CSSProperties = {
        width: '100%',
        height: '100%',
        border: '4px solid #d1d5db',
        boxSizing: 'border-box',
      };
      return {
        canvasStyle: style,
        layoutWidth: containerSize.width - 8,
        layoutHeight: containerSize.height - 8,
      };
    }

    const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
    const targetRatio = ratioW / ratioH;
    const containerRatio = containerSize.width / containerSize.height;

    let finalWidth, finalHeight;

    if (containerRatio > targetRatio) {
      finalHeight = containerSize.height;
      finalWidth = finalHeight * targetRatio;
    } else {
      finalWidth = containerSize.width;
      finalHeight = finalWidth / targetRatio;
    }

    const style: React.CSSProperties = {
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
      border: '4px solid #d1d5db',
      boxSizing: 'border-box',
    };

    return {
      canvasStyle: style,
      layoutWidth: finalWidth - 8,
      layoutHeight: finalHeight - 8,
    };
  }, [containerSize, aspectRatio]);

  const imagePositions = useMemo(() => {
    if (layoutWidth === 0 || images.length === 0) {
      return [];
    }
    return calculateLayout(images, layout, layoutWidth, layoutHeight, spacing);
  }, [images, layout, spacing, layoutWidth, layoutHeight]);


  // Event handlers for interactive pan and zoom of the *cell*
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, index: number) => {
    e.stopPropagation(); // Prevent event from bubbling to parent elements
    
    // Only respond to left click or single touch
    if ((e as React.MouseEvent).buttons === 1 || e.type === 'touchstart') { 
        onImageClick(index); // Set this image as active
        setIsDragging(true);
        activeDragImageRef.current = index;

        const clientX = e.type === 'mousedown' ? (e as React.MouseEvent).clientX : (e as React.TouchEvent).touches[0].clientX;
        const clientY = e.type === 'mousedown' ? (e as React.MouseEvent).clientY : (e as React.TouchEvent).touches[0].clientY;
        
        startMousePos.current = { x: clientX, y: clientY };
        startPanTransform.current = { ...imageTransforms[index].pan }; // Store initial pan value from imageTransform
    }
  }, [imageTransforms, onImageClick]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || activeDragImageRef.current === null || !startMousePos.current || !startPanTransform.current) return;

    const currentImageIndex = activeDragImageRef.current;
    const currentTransform = { ...imageTransforms[currentImageIndex] };

    const clientX = e.type === 'mousemove' ? (e as MouseEvent).clientX : (e as TouchEvent).touches[0].clientX;
    const clientY = e.type === 'mousemove' ? (e as MouseEvent).clientY : (e as TouchEvent).touches[0].clientY;

    const dx = clientX - startMousePos.current.x;
    const dy = clientY - startMousePos.current.y;

    currentTransform.pan = {
        x: startPanTransform.current.x + dx,
        y: startPanTransform.current.y + dy,
    };
    onImageTransformChange(currentTransform);
  }, [isDragging, imageTransforms, onImageTransformChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    activeDragImageRef.current = null;
    startPanTransform.current = null;
    startMousePos.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); // Prevent page scroll
    if (activeImageIndex === index) { // Only zoom the active image cell
        const scrollDelta = e.deltaY;
        const zoomFactor = 1.05; 
        
        const currentTransform = { ...imageTransforms[index] };
        const initialPos = imagePositions[index];
        if (!initialPos) return;

        let newZoom = scrollDelta < 0 ? currentTransform.zoom * zoomFactor : currentTransform.zoom / zoomFactor;
        newZoom = Math.max(0.1, Math.min(5, newZoom)); // Clamp zoom between 0.1x and 5x

        // Calculate new pan to keep the center of the cell fixed during zoom
        const currentEffectiveWidth = initialPos.width * currentTransform.zoom;
        const currentEffectiveHeight = initialPos.height * currentTransform.zoom;
        
        const newEffectiveWidth = initialPos.width * newZoom;
        const newEffectiveHeight = initialPos.height * newZoom;

        const deltaWidth = newEffectiveWidth - currentEffectiveWidth;
        const deltaHeight = newEffectiveHeight - currentEffectiveHeight;

        const newPanX = currentTransform.pan.x - deltaWidth / 2;
        const newPanY = currentTransform.pan.y - deltaHeight / 2;

        currentTransform.zoom = newZoom;
        currentTransform.pan = { x: newPanX, y: newPanY };
        onImageTransformChange(currentTransform);
    }
  }, [activeImageIndex, imageTransforms, imagePositions, onImageTransformChange]);

  // Attach global event listeners for dragging
  useLayoutEffect(() => {
    // Existing ResizeObserver
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    
    // New global drag/touch listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove as EventListener); 
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      observer.disconnect();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove as EventListener);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]); // Dependencies must be correct

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center select-none">
      <div
        ref={canvasRef}
        className="relative"
        style={{ 
            backgroundColor: backgroundColor,
            ...canvasStyle,
        }}
      >
        {imagePositions.map((initialPos, index) => {
          const image = images[index];
          const transform = imageTransforms[index];
          if (!image || !transform) return null;

          // Apply cell-level transformations (pan, zoom, rotation)
          const effectiveWidth = initialPos.width * transform.zoom;
          const effectiveHeight = initialPos.height * transform.zoom;
          const effectiveX = initialPos.x + transform.pan.x;
          const effectiveY = initialPos.y + transform.pan.y;
          const rotation = layout === 'polaroid' ? initialPos.rotation || 0 : 0; // Layout rotation + manual rotation (if any)
          const combinedRotation = rotation + transform.rotation; // Combine layout rotation with manual rotation

          return (
            <div
              key={image.id}
              draggable="false" // Prevent native browser drag behavior
              onMouseDown={(e) => handleMouseDown(e, index)}
              onTouchStart={(e) => handleMouseDown(e, index)}
              onWheel={(e) => handleWheel(e, index)}
              onClick={() => onImageClick(index)} // Still handle click for activation
              className="absolute overflow-hidden"
              style={{
                left: effectiveX,
                top: effectiveY,
                width: effectiveWidth,
                height: effectiveHeight,
                borderRadius: `${cornerRadius}px`,
                cursor: (index === activeImageIndex && isDragging) ? 'grabbing' : (index === activeImageIndex ? 'grab' : 'pointer'),
                border: index === activeImageIndex ? '3px solid #3b82f6' : 'none',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease', // Apply transition to the cell for smooth movement/resizing
                transform: `rotate(${combinedRotation}deg)`, // Apply combined rotation to the cell
                boxShadow: layout === 'polaroid' ? '3px 3px 8px rgba(0,0,0,0.2)' : 'none',
                backgroundColor: layout === 'polaroid' ? '#fff' : 'transparent',
                padding: layout === 'polaroid' ? `${initialPos.width * 0.05}px ${initialPos.width * 0.05}px ${initialPos.width * 0.2}px` : '0',
                userSelect: 'none', // Prevent text selection during drag
                WebkitUserSelect: 'none', // For Safari
                MozUserSelect: 'none', // For Firefox
                msUserSelect: 'none', // For IE/Edge
              }}
            >
              <img
                draggable="false"
                src={image.previewUrl}
                alt={image.file.name}
                className="absolute"
                style={{
                  width: '100%', // Fills the parent div (image cell)
                  height: '100%', // Fills the parent div (image cell)
                  top: 0,
                  left: 0,
                  objectFit: 'cover', // Ensures image covers the cell, cropping if necessary
                  // Inner image transform properties are removed, as pan/zoom/rotation now apply to the cell
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollageCanvas;