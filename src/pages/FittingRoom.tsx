import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Camera, Sparkles, CheckCircle2, ArrowLeft,
  ChevronRight, Download, FlipHorizontal, Share2,
  Loader2, RefreshCw, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';

type FittingRoomStep = 'START' | 'METHOD' | 'CAMERA' | 'UPLOAD' | 'FITTING';

interface OverlayStyle {
  width: number;
  top: number;
  left: number;
  scale: number;
  rotate: number;
  isFlipped: boolean;
  blendMode: string;
  brightness: number;
  contrast: number;
}

export default function FittingRoom() {
  const { data: allProducts = [], isLoading } = useProducts(100);
  const [step, setStep] = useState<FittingRoomStep>('START');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [photoNaturalW, setPhotoNaturalW] = useState(0);
  const [photoNaturalH, setPhotoNaturalH] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [studioMode, setStudioMode] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 450, h: 600 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [overlayStyle, setOverlayStyle] = useState<OverlayStyle>({
    width: 200, top: 150, left: 100, scale: 1,
    rotate: 0, isFlipped: false, blendMode: 'multiply',
    brightness: 1.0, contrast: 1.0,
  });

  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(canvasContainerRef.current);
    return () => ro.disconnect();
  }, [step]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch {
      toast.error('Camera access denied. Please check permissions.');
      setStep('METHOD');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const url = canvas.toDataURL('image/jpeg');
      stopCamera();
      setUserPhoto(url);
      setStep('FITTING');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image must be under 15MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth < 300 || img.naturalHeight < 400) {
        toast.error('Image too small. Please use a photo at least 300x400px.');
        return;
      }
      setUserPhoto(url);
      setStep('FITTING');
    };
    img.src = url;
  };

  const autoAlignProduct = useCallback(() => {
    if (!selectedProduct || !photoNaturalW || !photoNaturalH) return;
    const { w: containerW, h: containerH } = containerSize;
    const imgRatio = photoNaturalW / photoNaturalH;
    const containerRatio = containerW / containerH;

    let renderedW: number, renderedH: number, offsetX: number, offsetY: number;
    if (imgRatio > containerRatio) {
      renderedW = containerW;
      renderedH = containerW / imgRatio;
      offsetX = 0;
      offsetY = (containerH - renderedH) / 2;
    } else {
      renderedH = containerH;
      renderedW = containerH * imgRatio;
      offsetX = (containerW - renderedW) / 2;
      offsetY = 0;
    }

    const cat = (selectedProduct.category || selectedProduct.productType || '').toLowerCase();
    let centerX: number, topY: number, width: number;

    if (cat.includes('bottom') || cat.includes('pant') || cat.includes('skirt') || cat.includes('short')) {
      centerX = offsetX + renderedW * 0.5;
      topY = offsetY + renderedH * 0.48;
      width = renderedW * 0.65;
    } else if (cat.includes('top') || cat.includes('shirt') || cat.includes('blouse') || cat.includes('jacket')) {
      centerX = offsetX + renderedW * 0.5;
      topY = offsetY + renderedH * 0.18;
      width = renderedW * 0.72;
    } else {
      centerX = offsetX + renderedW * 0.5;
      topY = offsetY + renderedH * 0.16;
      width = renderedW * 0.72;
    }

    setOverlayStyle(prev => ({
      ...prev,
      left: centerX - width / 2,
      top: topY,
      width,
      scale: 1,
      rotate: 0,
      isFlipped: false,
    }));
  }, [selectedProduct, photoNaturalW, photoNaturalH, containerSize]);

  useEffect(() => {
    if (step === 'FITTING' && selectedProduct && photoNaturalW && containerSize.w > 0) {
      autoAlignProduct();
    }
  }, [step, selectedProduct, photoNaturalW, containerSize, autoAlignProduct]);

  useEffect(() => {
    if (!selectedProduct && allProducts.length > 0) {
      setSelectedProduct(allProducts[0]);
    }
  }, [allProducts, selectedProduct]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const sizeConfidence = useMemo(() => {
    if (!selectedProduct) return null;
    const text = ((selectedProduct.title || '') + ' ' + (selectedProduct.category || '')).toLowerCase();
    if (text.includes('oversized') || text.includes('relaxed') || text.includes('wide')) {
      return { label: 'Relaxed Fit', color: 'bg-blue-100 text-blue-700', tip: 'Generous cut — when in doubt, size down for a cleaner look.' };
    }
    if (text.includes('fitted') || text.includes('bodysuit') || text.includes('tight') || text.includes('slim')) {
      return { label: 'Fitted Style', color: 'bg-rose-100 text-rose-700', tip: 'For fitted styles, we recommend your true size. Size up if between sizes.' };
    }
    if (text.includes('structured') || text.includes('blazer') || text.includes('jacket')) {
      return { label: 'Structured Fit', color: 'bg-amber-100 text-amber-700', tip: 'Structured pieces run true to size. Consider shoulder fit first.' };
    }
    return { label: 'True to Size', color: 'bg-green-100 text-green-700', tip: 'This style runs true to size. Order your usual size.' };
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'All') return allProducts;
    return allProducts.filter(p =>
      p.category?.toLowerCase().includes(categoryFilter.toLowerCase()) ||
      p.productType?.toLowerCase().includes(categoryFilter.toLowerCase())
    );
  }, [allProducts, categoryFilter]);

  const handleSaveLook = async () => {
    if (!userPhoto || !selectedProduct || !canvasContainerRef.current) return;
    setIsSaving(true);
    playSound('click');
    try {
      const container = canvasContainerRef.current;
      const rect = container.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = src;
        });

      const [userImg, productImg] = await Promise.all([
        loadImage(userPhoto),
        loadImage(selectedProduct.images[0]?.url),
      ]);

      canvas.width = userImg.width;
      canvas.height = userImg.height;

      if (studioMode) ctx.filter = 'blur(3px) brightness(1.15) contrast(0.95)';
      ctx.drawImage(userImg, 0, 0);
      ctx.filter = 'none';

      const imgRatio = userImg.width / userImg.height;
      const containerRatio = rect.width / rect.height;
      let displayW: number, displayH: number, offX: number, offY: number;
      if (imgRatio > containerRatio) {
        displayW = rect.width; displayH = rect.width / imgRatio;
        offX = 0; offY = (rect.height - displayH) / 2;
      } else {
        displayH = rect.height; displayW = rect.height * imgRatio;
        offY = 0; offX = (rect.width - displayW) / 2;
      }

      const sf = userImg.width / displayW;
      ctx.save();
      const pw = overlayStyle.width * overlayStyle.scale * sf;
      const ph = pw * (productImg.height / productImg.width);
      const cx = (overlayStyle.left - offX + overlayStyle.width / 2) * sf;
      const cy = (overlayStyle.top - offY + (overlayStyle.width * productImg.height / productImg.width) / 2) * sf;
      ctx.translate(cx, cy);
      ctx.rotate((overlayStyle.rotate * Math.PI) / 180);
      if (overlayStyle.isFlipped) ctx.scale(-1, 1);
      ctx.filter = `brightness(${overlayStyle.brightness}) contrast(${overlayStyle.contrast})`;
      ctx.globalCompositeOperation = overlayStyle.blendMode as GlobalCompositeOperation;
      ctx.drawImage(productImg, -pw / 2, -ph / 2, pw, ph);
      ctx.restore();

      ctx.save();
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = 'rgba(176,141,87,0.75)';
      ctx.textAlign = 'right';
      ctx.fillText('NINA ARMEND AI STUDIO', canvas.width - 40, canvas.height - 40);
      ctx.restore();

      const link = document.createElement('a');
      link.download = `nina-armend-look-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Look saved!');
    } catch {
      toast.error('Failed to save look.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <AnimatePresence mode="wait">

            {step === 'START' && (
              <motion.div key="start" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto text-center space-y-8">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1 px-4 uppercase tracking-[0.2em] text-[10px]">Virtual Fitting Experience</Badge>
                <h1 className="font-serif text-5xl md:text-7xl tracking-tight">Find Your <span className="italic">Perfect</span> Fit</h1>
                <p className="text-muted-foreground text-lg md:text-xl font-serif italic max-w-2xl mx-auto">Upload a photo or use your camera, then try any piece from the collection directly on you.</p>
                <div className="grid md:grid-cols-3 gap-6 text-left mt-12">
                  {[
                    { icon: Camera, title: 'Step 1: Capture', desc: 'Take or upload a full-body photo in good lighting.' },
                    { icon: Sparkles, title: 'Step 2: Try It On', desc: 'Browse the collection and see pieces on your body.' },
                    { icon: CheckCircle2, title: 'Step 3: Save & Shop', desc: 'Download your look or add directly to your cart.' },
                  ].map((item, i) => (
                    <div key={i} className="p-6 bg-card border border-border/50 rounded-2xl shadow-sm">
                      <item.icon className="h-8 w-8 text-primary mb-4" />
                      <h3 className="font-serif text-xl mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-8">
                  <Button size="lg" onClick={() => setStep('METHOD')} className="rounded-full px-12 py-6 text-lg h-auto shadow-gold">
                    Get Started <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'METHOD' && (
              <motion.div key="method" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="font-serif text-4xl">How would you like to proceed?</h2>
                  <p className="text-muted-foreground">Choose a method to provide your photo.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => { setStep('CAMERA'); startCamera(); }} className="flex flex-col items-center p-12 bg-card border-2 border-border/50 rounded-3xl hover:border-primary/50 transition-all group">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-serif text-2xl mb-2">Use Live Camera</h3>
                    <p className="text-sm text-center text-muted-foreground">Take a photo now using your device's camera.</p>
                  </button>
                  <button onClick={() => setStep('UPLOAD')} className="flex flex-col items-center p-12 bg-card border-2 border-border/50 rounded-3xl hover:border-primary/50 transition-all group">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-serif text-2xl mb-2">Upload Image</h3>
                    <p className="text-sm text-center text-muted-foreground">Choose a photo from your gallery or computer.</p>
                  </button>
                </div>
                <div className="flex justify-center">
                  <Button variant="ghost" onClick={() => setStep('START')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                </div>
              </motion.div>
            )}

            {step === 'CAMERA' && (
              <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="font-serif text-3xl">Live Capture</h2>
                  <p className="text-muted-foreground text-sm">Stand 5-7 feet back so your full body is visible.</p>
                </div>
                <div className="relative aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-border/10">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute top-8 left-0 right-0 flex justify-center">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full flex items-center gap-3">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-white text-xs font-bold uppercase tracking-widest">Camera Ready</span>
                    </div>
                  </div>
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8 items-center">
                    <Button size="icon" variant="outline" className="h-14 w-14 rounded-full bg-black/40 border-white/20 text-white hover:bg-white/20 backdrop-blur-md" onClick={() => { stopCamera(); setStep('METHOD'); }}>
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="relative p-1 rounded-full border-4 border-white/30">
                      <button onClick={capturePhoto} className="h-20 w-20 rounded-full bg-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                        <Camera className="h-8 w-8 text-black" />
                      </button>
                    </div>
                    <div className="h-14 w-14" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'UPLOAD' && (
              <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
                <div className="aspect-[3/4] border-2 border-dashed border-border/50 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center space-y-6 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl">Drop your photo here</h3>
                    <p className="text-muted-foreground">or click to browse from your device</p>
                  </div>
                  <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <div className="pt-4 flex flex-wrap justify-center gap-3">
                    <Badge variant="secondary">JPG</Badge>
                    <Badge variant="secondary">PNG</Badge>
                    <Badge variant="secondary">Max 15MB</Badge>
                  </div>
                </div>
                <div className="mt-8 flex justify-center">
                  <Button variant="ghost" onClick={() => setStep('METHOD')}><ArrowLeft className="mr-2 h-4 w-4" /> Change Method</Button>
                </div>
              </motion.div>
            )}

            {step === 'FITTING' && (
              <motion.div key="fitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-12 gap-12 items-start">

                <div className="lg:col-span-3 space-y-6 bg-card border border-border/50 p-6 rounded-3xl shadow-sm">
                  <div className="border-b border-border pb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl">Collection</h2>
                    <Button variant="ghost" size="sm" onClick={() => { setUserPhoto(null); setStep('METHOD'); }}><RefreshCw className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Top', 'Bottom', 'One-Piece'].map(cat => (
                      <button key={cat} onClick={() => setCategoryFilter(cat)} className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${categoryFilter === cat ? 'bg-primary text-white border-primary' : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {filteredProducts.map(product => (
                      <button key={product.id} onClick={() => { setSelectedProduct(product); playSound('click'); }} className="group/item flex flex-col gap-2 text-left">
                        <div className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${selectedProduct?.id === product.id ? 'border-primary shadow-md scale-[0.98]' : 'border-transparent hover:border-primary/30'}`}>
                          <img src={product.images[0]?.url} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" />
                        </div>
                        <div className="px-1">
                          <p className="text-[9px] font-bold truncate uppercase tracking-tighter">{product.title}</p>
                          <p className="text-[9px] text-muted-foreground">${product.price.amount}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-6">
                  <div ref={canvasContainerRef} className="relative aspect-[3/4] bg-secondary/20 rounded-[2.5rem] border border-border/50 overflow-hidden shadow-2xl">
                    {userPhoto && (
                      <img
                        src={userPhoto}
                        alt="You"
                        className={`w-full h-full object-contain transition-all duration-700 ${studioMode ? 'brightness-115 contrast-95 blur-sm' : ''}`}
                        onLoad={e => {
                          setPhotoNaturalW(e.currentTarget.naturalWidth);
                          setPhotoNaturalH(e.currentTarget.naturalHeight);
                        }}
                      />
                    )}
                    {selectedProduct && !showComparison && (
                      <div
                        style={{
                          position: 'absolute',
                          width: overlayStyle.width * overlayStyle.scale,
                          top: overlayStyle.top + 6,
                          left: overlayStyle.left - 3,
                          height: overlayStyle.width * overlayStyle.scale * 1.3,
                          background: 'radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.2) 0%, transparent 70%)',
                          filter: 'blur(14px)',
                          transform: `rotate(${overlayStyle.rotate}deg)`,
                          pointerEvents: 'none',
                          zIndex: 19,
                        }}
                      />
                    )}
                    {selectedProduct && (
                      <motion.div
                        key={selectedProduct.id}
                        drag
                        dragMomentum={false}
                        onDragEnd={(_, info) => setOverlayStyle(prev => ({ ...prev, left: prev.left + info.offset.x, top: prev.top + info.offset.y }))}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showComparison ? 0 : 1 }}
                        className="absolute cursor-move select-none"
                        style={{
                          width: overlayStyle.width,
                          top: overlayStyle.top,
                          left: overlayStyle.left,
                          transform: `scale(${overlayStyle.scale}) rotate(${overlayStyle.rotate}deg) scaleX(${overlayStyle.isFlipped ? -1 : 1})`,
                          transformOrigin: 'top center',
                          mixBlendMode: overlayStyle.blendMode as any,
                          filter: `drop-shadow(0 8px 24px rgba(0,0,0,0.35)) drop-shadow(0 2px 6px rgba(0,0,0,0.2)) brightness(${overlayStyle.brightness}) contrast(${overlayStyle.contrast})`,
                          zIndex: 20,
                        }}
                      >
                        <img src={selectedProduct.images[0]?.url} alt="Try on" className="w-full h-auto" draggable={false} />
                      </motion.div>
                    )}
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                      <Badge variant="outline" className="bg-black/20 backdrop-blur-md text-white border-white/20 px-4 py-2 uppercase tracking-widest text-[8px]">Smart Alignment</Badge>
                    </div>
                    <AnimatePresence>
                      {isSaving && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center">
                          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                          <h3 className="font-serif text-2xl mb-2">Generating Export</h3>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setStudioMode(!studioMode)} className={studioMode ? 'bg-primary/10 border-primary' : ''}>Studio Mode</Button>
                    <Button variant="outline" size="sm" onMouseDown={() => setShowComparison(true)} onMouseUp={() => setShowComparison(false)} onMouseLeave={() => setShowComparison(false)}>Hold to Compare</Button>
                    <Button className="bg-primary shadow-gold rounded-full px-8" onClick={handleSaveLook} disabled={isSaving}>
                      <Download className="mr-2 h-4 w-4" /> Save Look
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm space-y-5">
                    <h3 className="font-serif text-lg border-b border-border pb-2">Fit Controls</h3>
                    {[
                      { label: 'Scale', key: 'scale', min: 0.4, max: 2.2, step: 0.01, display: (v: number) => `${Math.round(v * 100)}%` },
                      { label: 'Rotation', key: 'rotate', min: -45, max: 45, step: 1, display: (v: number) => `${v}°` },
                      { label: 'Brightness', key: 'brightness', min: 0.7, max: 1.4, step: 0.05, display: (v: number) => `${Math.round(v * 100)}%` },
                      { label: 'Contrast', key: 'contrast', min: 0.8, max: 1.4, step: 0.05, display: (v: number) => `${Math.round(v * 100)}%` },
                    ].map(({ label, key, min, max, step, display }) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-bold">{label}</label>
                          <span className="text-[10px] font-mono">{display((overlayStyle as any)[key])}</span>
                        </div>
                        <input type="range" min={min} max={max} step={step} value={(overlayStyle as any)[key]}
                          onChange={e => setOverlayStyle(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                          className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setOverlayStyle(prev => ({ ...prev, isFlipped: !prev.isFlipped }))}>
                        <FlipHorizontal className="h-4 w-4 mr-2" /> Flip
                      </Button>
                      <select className="bg-background border border-border rounded-md px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary flex-1" value={overlayStyle.blendMode} onChange={e => setOverlayStyle(prev => ({ ...prev, blendMode: e.target.value }))}>
                        <option value="normal">Natural</option>
                        <option value="multiply">Fabric Shadow</option>
                        <option value="screen">Light Fabric</option>
                        <option value="overlay">Deep Blend</option>
                      </select>
                    </div>
                    <Button variant="outline" className="w-full" onClick={autoAlignProduct}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Reset Alignment
                    </Button>
                  </div>

                  {sizeConfidence && (
                    <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm space-y-3">
                      <h4 className="font-serif text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Size Confidence</h4>
                      <Badge className={`${sizeConfidence.color} border-0 font-semibold`}>{sizeConfidence.label}</Badge>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{sizeConfidence.tip}</p>
                    </div>
                  )}

                  <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl space-y-3">
                    <h4 className="font-serif text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Pro Tips</h4>
                    <ul className="text-[10px] space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
                      <li>Use "Fabric Shadow" blend for the most natural look.</li>
                      <li>Drag the garment to fine-tune placement.</li>
                      <li>Hit "Reset Alignment" after switching products.</li>
                      <li>Studio Mode adds soft focus for a styled photo feel.</li>
                    </ul>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => toast.info('Sharing coming soon!')}>
                    <Share2 className="h-4 w-4 mr-2" /> Share Look
                  </Button>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
