
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RotateCw } from 'lucide-react';

interface ThreeSixtyViewerProps {
  images: string[];
  className?: string;
}

export function ThreeSixtyViewer({ images, className = "" }: ThreeSixtyViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const loadedCount = useRef(0);

  useEffect(() => {
    if (!images) return;
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount.current += 1;
        if (loadedCount.current === images.length) {
          setIsLoading(false);
        }
      };
    });
  }, [images]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 10) {
      const sensitivity = 5;
      const step = Math.floor(diff / sensitivity);
      const newIndex = (currentIndex - step + images.length) % images.length;
      setCurrentIndex(newIndex);
      setStartX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    if (Math.abs(diff) > 10) {
      const sensitivity = 5;
      const step = Math.floor(diff / sensitivity);
      const newIndex = (currentIndex - step + images.length) % images.length;
      setCurrentIndex(newIndex);
      setStartX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!images || images.length === 0) {
    return (
      <div className={`relative aspect-[3/4] bg-card rounded-sm overflow-hidden flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground text-sm">No 360° view available</p>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[3/4] bg-card rounded-sm overflow-hidden cursor-grab active:cursor-grabbing ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <img
        src={images[currentIndex]}
        alt="Product 360 view"
        className="w-full h-full object-cover pointer-events-none"
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 shadow-sm pointer-events-none">
        <RotateCw className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground">Drag to Rotate 360°</span>
      </div>
    </div>
  );
}
