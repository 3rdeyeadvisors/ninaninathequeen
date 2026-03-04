import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Move, Download, Sparkles,
  Share2, Loader2, FlipHorizontal, Camera,
  ArrowLeft, CheckCircle2, AlertCircle, Info,
  RefreshCw, ChevronRight, Maximize2
} from 'lucide-react';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';

type FittingRoomStep = 'START' | 'METHOD' | 'CAMERA' | 'UPLOAD' | 'FITTING';

export default function FittingRoom() {
  const { data: allProducts = [], isLoading } = useProducts(100);
  const [step, setStep] = useState<FittingRoomStep>('START');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);

  // Dimensions state
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [userPhotoNaturalSize, setUserPhotoNaturalSize] = useState({ width: 0, height: 0 });
  const [sizeConfidence, setSizeConfidence] = useState<{ fit: string, note: string } | null>(null);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Canvas/Fitting refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [studioMode, setStudioMode] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const [overlayStyle, setOverlayStyle] = useState({
    width: 200,
    top: 150,
    left: 100,
    scale: 1,
    rotate: 0,
    isFlipped: false,
    blendMode: 'multiply',
    brightness: 1.0,
    contrast: 1.0
  });

  // ResizeObserver for container
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(canvasContainerRef.current);
    return () => observer.disconnect();
  }, [step]); // Re-run when step changes to ensure ref is captured

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setLocalValidationError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      toast.error("Camera access denied. Please check your permissions.");
      setStep('METHOD');
    }
  };

  const validateAndProceed = (url: string, width: number, height: number) => {
    if (width < 300 || height < 400) {
      setLocalValidationError("Image is too small. Minimum dimensions are 300x400px.");
      return false;
    }
    setUserPhoto(url);
    setStep('FITTING');
    playSound('success');
    return true;
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

      if (validateAndProceed(url, canvas.width, canvas.height)) {
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setLocalValidationError("File size exceeds 15MB limit.");
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      validateAndProceed(url, img.naturalWidth, img.naturalHeight);
    };
    img.src = url;
  };

  const autoAlignProduct = useCallback(() => {
    if (!selectedProduct || !userPhotoNaturalSize.width || !containerSize.width) return;

    const containerW = containerSize.width;
    const containerH = containerSize.height;
    const userPhotoNaturalW = userPhotoNaturalSize.width;
    const userPhotoNaturalH = userPhotoNaturalSize.height;

    const imgNaturalRatio = userPhotoNaturalW / userPhotoNaturalH;
    const containerRatio = containerW / containerH;

    // Compute the actual rendered size of the user photo (object-contain)
    let renderedW, renderedH, offsetX, offsetY;
    if (imgNaturalRatio > containerRatio) {
      renderedW = containerW;
      renderedH = containerW / imgNaturalRatio;
      offsetX = 0;
      offsetY = (containerH - renderedH) / 2;
    } else {
      renderedH = containerH;
      renderedW = containerH * imgNaturalRatio;
      offsetX = (containerW - renderedW) / 2;
      offsetY = 0;
    }

    const category = selectedProduct.category?.toLowerCase() || 'one-piece';
    let centerX, topY, width;

    if (category.includes('top')) {
      centerX = offsetX + renderedW * 0.5;
      topY = offsetY + renderedH * 0.18;
      width = renderedW * 0.72;
    } else if (category.includes('bottom')) {
      centerX = offsetX + renderedW * 0.5;
      topY = offsetY + renderedH * 0.48;
      width = renderedW * 0.65;
    } else {
      // One-piece / default
      centerX = offsetX + renderedW * 0.5;
      topY = offsetY + renderedH * 0.16;
      width = renderedW * 0.72;
    }

    setOverlayStyle(prev => ({
      ...prev,
      left: centerX - width / 2,
      top: topY,
      width: width,
      scale: 1,
      rotate: 0,
      isFlipped: false,
      blendMode: 'multiply'
    }));
  }, [selectedProduct, userPhotoNaturalSize, containerSize]);

  // Size confidence logic
  useEffect(() => {
    if (!selectedProduct) {
      setSizeConfidence(null);
      return;
    }

    const title = selectedProduct.title?.toLowerCase() || '';
    const category = selectedProduct.category?.toLowerCase() || '';
    const fullText = `${title} ${category}`;

    if (fullText.includes('oversized') || fullText.includes('relaxed')) {
      setSizeConfidence({
        fit: "Relaxed Fit",
        note: "This style is forgiving on sizing — when in doubt, size down."
      });
    } else if (fullText.includes('fitted') || fullText.includes('bodysuit')) {
      setSizeConfidence({
        fit: "Slim Fit",
        note: "For fitted styles, we recommend your true size."
      });
    } else if (fullText.includes('structured') || fullText.includes('blazer')) {
      setSizeConfidence({
        fit: "Structured Fit",
        note: "Tailored to provide a clean silhouette. Stick to your usual size."
      });
    } else {
      setSizeConfidence({
        fit: "Standard Fit",
        note: "Fits true to size for most body types."
      });
    }
  }, [selectedProduct]);

  // Trigger auto-align
  useEffect(() => {
    if (step === 'FITTING' && selectedProduct && userPhoto && containerSize.width > 0 && userPhotoNaturalSize.width > 0) {
      autoAlignProduct();
    }
  }, [step, selectedProduct, userPhoto, containerSize.width, userPhotoNaturalSize.width]);

  const handleSaveLook = async () => {
    if (!userPhoto || !selectedProduct || !canvasContainerRef.current) return;
    setIsSaving(true);
    playSound('click');

    try {
      const container = canvasContainerRef.current;
      const rect = container.getBoundingClientRect();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      const [userImg, productImg] = await Promise.all([
        loadImage(userPhoto),
        loadImage(selectedProduct.images[0]?.url)
      ]);

      canvas.width = userImg.width;
      canvas.height = userImg.height;

      if (studioMode) {
        ctx.filter = 'blur(4px) brightness(1.15) contrast(0.95)';
      }
      ctx.drawImage(userImg, 0, 0);
      ctx.filter = 'none';

      const imageRatio = userImg.width / userImg.height;
      const containerRatio = rect.width / rect.height;

      let displayWidth, displayHeight, offsetX, offsetY;
      if (imageRatio > containerRatio) {
        displayWidth = rect.width;
        displayHeight = rect.width / imageRatio;
        offsetX = 0;
        offsetY = (rect.height - displayHeight) / 2;
      } else {
        displayHeight = rect.height;
        displayWidth = rect.height * imageRatio;
        offsetY = 0;
        offsetX = (rect.width - displayWidth) / 2;
      }

      const scaleFactor = userImg.width / displayWidth;

      ctx.save();
      const productRealWidth = overlayStyle.width * overlayStyle.scale * scaleFactor;
      const productRealHeight = (overlayStyle.width * (productImg.height / productImg.width)) * overlayStyle.scale * scaleFactor;

      const centerX = (overlayStyle.left - offsetX + overlayStyle.width / 2) * scaleFactor;
      const centerY = (overlayStyle.top - offsetY + (overlayStyle.width * (productImg.height / productImg.width)) / 2) * scaleFactor;

      ctx.translate(centerX, centerY);
      ctx.rotate((overlayStyle.rotate * Math.PI) / 180);
      if (overlayStyle.isFlipped) ctx.scale(-1, 1);

      // Apply filters for export
      ctx.filter = `contrast(${overlayStyle.contrast}) brightness(${overlayStyle.brightness})`;
      ctx.globalCompositeOperation = overlayStyle.blendMode as GlobalCompositeOperation;
      ctx.drawImage(productImg, -productRealWidth / 2, -productRealHeight / 2, productRealWidth, productRealHeight);
      ctx.restore();

      ctx.save();
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = 'rgba(176, 141, 87, 0.8)';
      ctx.textAlign = 'right';
      ctx.fillText('NINA ARMEND AI STUDIO', canvas.width - 40, canvas.height - 40);
      ctx.restore();

      const link = document.createElement('a');
      link.download = `nina-armend-look-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success("Look saved to your gallery!");
    } catch (error) {
      console.error("Error saving look:", error);
      toast.error("Failed to save look.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      if (categoryFilter === 'All') return true;
      return product.category?.includes(categoryFilter) || product.productType?.includes(categoryFilter);
    });
  }, [allProducts, categoryFilter]);

  useEffect(() => {
    if (!selectedProduct && allProducts.length > 0) {
      setSelectedProduct(allProducts[0]);
    }
  }, [allProducts, selectedProduct]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <AnimatePresence mode="wait">
            {step === 'START' && (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto text-center space-y-8"
              >
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1 px-4 uppercase tracking-[0.2em] text-[10px]">Virtual Fitting Experience</Badge>
                <h1 className="font-serif text-5xl md:text-7xl tracking-tight">Find Your <span className="italic">Perfect</span> Fit</h1>
                <p className="text-muted-foreground text-lg md:text-xl font-serif italic max-w-2xl mx-auto">
                  Our AI-powered fitting room analyzes your silhouette to provide accurate placement and size confidence.
                </p>

                <div className="grid md:grid-cols-3 gap-6 text-left mt-12">
                  {[
                    { icon: Camera, title: "Step 1: Capture", desc: "Take a photo or upload one of yourself standing straight." },
                    { icon: Sparkles, title: "Step 2: AI Analysis", desc: "We'll detect your silhouette and align the garments perfectly." },
                    { icon: CheckCircle2, title: "Step 3: Try It On", desc: "Switch styles, adjust the fit, and save your favorite looks." }
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
              <motion.div
                key="method"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4">
                  <h2 className="font-serif text-4xl">How would you like to proceed?</h2>
                  <p className="text-muted-foreground">Choose a method to provide your photo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => { setStep('CAMERA'); startCamera(); }}
                    className="flex flex-col items-center p-12 bg-card border-2 border-border/50 rounded-3xl hover:border-primary/50 transition-all group"
                  >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-serif text-2xl mb-2">Use Live Camera</h3>
                    <p className="text-sm text-center text-muted-foreground">Take a photo now using your device's camera.</p>
                  </button>

                  <button
                    onClick={() => setStep('UPLOAD')}
                    className="flex flex-col items-center p-12 bg-card border-2 border-border/50 rounded-3xl hover:border-primary/50 transition-all group"
                  >
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-serif text-2xl mb-2">Upload Image</h3>
                    <p className="text-sm text-center text-muted-foreground">Choose a photo from your gallery or computer.</p>
                  </button>
                </div>

                <div className="flex justify-center">
                  <Button variant="ghost" onClick={() => setStep('START')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Intro
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'CAMERA' && (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                <div className="text-center space-y-2 mb-4">
                  <h2 className="font-serif text-3xl">Live Capture</h2>
                  <p className="text-muted-foreground text-sm">Please stand 5-7 feet away from your device.</p>
                </div>

                {localValidationError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 mb-4">
                    <AlertCircle className="h-4 w-4" /> {localValidationError}
                  </div>
                )}

                <div className="relative aspect-[3/4] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-border/10">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />

                  {/* Enhanced Silhouette Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <svg viewBox="0 0 400 600" className="w-full h-full">
                      <defs>
                        <linearGradient id="silhouetteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="white" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="white" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>

                      {/* Human Silhouette Guide */}
                      <path
                        d="M200,40 Q225,40 235,70 Q245,100 225,130 Q205,160 200,190 Q195,160 175,130 Q155,100 165,70 Q175,40 200,40
                           M200,190 L260,205 Q290,210 300,260 L310,350 Q315,400 305,450 L290,560 Q285,580 260,580 L220,580 L210,400 L200,400 L190,400 L180,580 L140,580 Q115,580 110,560 L95,450 Q85,400 90,350 L100,260 Q110,210 140,205 L200,190"
                        fill="url(#silhouetteGrad)"
                        stroke="white"
                        strokeWidth="2"
                        strokeDasharray="10 5"
                        className="animate-pulse"
                      />

                      {/* Guidance Markers */}
                      <g className="text-[10px] fill-white/80 font-sans tracking-widest uppercase">
                        <text x="200" y="30" textAnchor="middle">Head Position</text>
                        <line x1="150" y1="205" x2="250" y2="205" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
                        <text x="200" y="220" textAnchor="middle">Shoulder Line</text>
                        <line x1="130" y1="380" x2="270" y2="380" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
                        <text x="200" y="395" textAnchor="middle">Hip Line</text>
                        <text x="200" y="595" textAnchor="middle">Feet Placement</text>
                      </g>
                    </svg>
                  </div>

                  {/* Dynamic Instructions */}
                  <div className="absolute top-8 left-0 right-0 flex justify-center">
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="bg-black/60 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full flex items-center gap-3"
                    >
                      <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-white text-xs font-bold uppercase tracking-widest">System Ready: Find your pose</span>
                    </motion.div>
                  </div>

                  <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-8">
                      <Button
                        size="icon" variant="outline"
                        className="h-14 w-14 rounded-full bg-black/40 border-white/20 text-white hover:bg-white/20 transition-all backdrop-blur-md"
                        onClick={() => { stopCamera(); setStep('METHOD'); }}
                      >
                        <ArrowLeft className="h-6 w-6" />
                      </Button>

                      <div className="relative p-1 rounded-full border-4 border-white/30">
                        <button
                          onClick={capturePhoto}
                          className="h-20 w-20 rounded-full bg-white flex items-center justify-center group active:scale-90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                        >
                          <Camera className="h-8 w-8 text-black group-hover:scale-110 transition-transform" />
                        </button>
                      </div>

                      <div className="h-14 w-14" /> {/* Spacer */}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="flex flex-col gap-1 p-4 bg-card border border-border/50 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Maximize2 className="h-4 w-4 text-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Distance</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Full body should be visible from head to toe.</p>
                   </div>
                   <div className="flex flex-col gap-1 p-4 bg-card border border-border/50 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Posturing</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Stand straight with arms slightly away from body.</p>
                   </div>
                   <div className="flex flex-col gap-1 p-4 bg-card border border-border/50 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Environment</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Avoid backlighting. Natural front lighting is best.</p>
                   </div>
                </div>
              </motion.div>
            )}

            {step === 'UPLOAD' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                {localValidationError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 mb-4">
                    <AlertCircle className="h-4 w-4" /> {localValidationError}
                  </div>
                )}

                <div
                  className="aspect-[3/4] border-2 border-dashed border-border/50 rounded-[2rem] flex flex-col items-center justify-center p-12 text-center space-y-6 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl">Drop your photo here</h3>
                    <p className="text-muted-foreground">or click to browse from your device</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <div className="pt-4 flex flex-wrap justify-center gap-3">
                    <Badge variant="secondary">JPG</Badge>
                    <Badge variant="secondary">PNG</Badge>
                    <Badge variant="secondary">Max 15MB</Badge>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <Button variant="ghost" onClick={() => setStep('METHOD')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Change Method
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'FITTING' && (
              <motion.div
                key="fitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid lg:grid-cols-12 gap-12 items-start"
              >
                {/* Left: Product Selection */}
                <div className="lg:col-span-3 space-y-6 bg-card border border-border/50 p-6 rounded-3xl shadow-sm">
                  <div className="border-b border-border pb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl">Collection</h2>
                    <Button variant="ghost" size="sm" onClick={() => setStep('METHOD')}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['All', 'Top', 'Bottom', 'One-Piece'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                          categoryFilter === cat ? 'bg-primary text-white border-primary shadow-sm' : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product);
                          playSound('click');
                        }}
                        className="group/item flex flex-col gap-2 text-left"
                      >
                        <div className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                          selectedProduct?.id === product.id ? 'border-primary shadow-md scale-[0.98]' : 'border-transparent hover:border-primary/30'
                        }`}>
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

                {/* Center: Fitting Canvas */}
                <div className="lg:col-span-6 space-y-6">
                  <div
                    ref={canvasContainerRef}
                    className="relative aspect-[3/4] bg-secondary/20 rounded-[2.5rem] border border-border/50 overflow-hidden shadow-2xl"
                  >
                    {userPhoto && (
                      <div className="relative w-full h-full">
                        <img
                          src={userPhoto}
                          alt="User"
                          onLoad={(e) => {
                            setUserPhotoNaturalSize({
                              width: e.currentTarget.naturalWidth,
                              height: e.currentTarget.naturalHeight
                            });
                          }}
                          className={`w-full h-full object-contain transition-all duration-700 ${
                            studioMode ? 'filter blur-[2px] brightness-115 contrast-95' : ''
                          }`}
                        />
                        {studioMode && (
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/30 pointer-events-none" />
                        )}

                        {/* Body Shadow Layer */}
                        <div
                          className="absolute pointer-events-none z-19"
                          style={{
                            width: overlayStyle.width,
                            top: overlayStyle.top + 4,
                            left: overlayStyle.left - 2,
                            height: overlayStyle.width * 1.3,
                            background: 'radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.18) 0%, transparent 70%)',
                            filter: 'blur(12px)',
                            transform: `scale(${overlayStyle.scale}) rotate(${overlayStyle.rotate}deg)`,
                            transformOrigin: 'top center',
                          }}
                        />

                        {/* Garment Overlay */}
                        <motion.div
                          drag dragMomentum={false}
                          onDragEnd={(_, info) => setOverlayStyle(prev => ({
                            ...prev, left: prev.left + info.offset.x, top: prev.top + info.offset.y
                          }))}
                          className="absolute cursor-move z-20 select-none"
                          style={{
                            width: overlayStyle.width,
                            top: overlayStyle.top,
                            left: overlayStyle.left,
                            transform: `scale(${overlayStyle.scale}) rotate(${overlayStyle.rotate}deg) scaleX(${overlayStyle.isFlipped ? -1 : 1})`,
                            transformOrigin: 'top center',
                            mixBlendMode: overlayStyle.blendMode as any,
                            filter: `drop-shadow(0 8px 24px rgba(0,0,0,0.35)) drop-shadow(0 2px 6px rgba(0,0,0,0.2)) contrast(${overlayStyle.contrast}) brightness(${overlayStyle.brightness})`,
                          }}
                        >
                          <img
                            src={selectedProduct?.images[0]?.url}
                            alt="Try on"
                            className="w-full h-auto"
                            draggable={false}
                            style={{ display: 'block' }}
                          />
                        </motion.div>
                      </div>
                    )}

                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                       <Badge variant="outline" className="bg-black/20 backdrop-blur-md text-white border-white/20 px-4 py-2 uppercase tracking-widest text-[8px]">Pro Virtual Fit</Badge>
                    </div>

                    <AnimatePresence>
                      {isSaving && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center"
                        >
                           <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                           <h3 className="font-serif text-2xl mb-2">Generating Export</h3>
                           <p className="text-muted-foreground text-sm uppercase tracking-widest">Optimizing high-res look...</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                     <Button variant="outline" size="sm" onClick={() => setStudioMode(!studioMode)} className={studioMode ? "bg-primary/10 border-primary" : ""}>
                        Studio Mode
                     </Button>
                     <Button variant="outline" size="sm" onMouseDown={() => setShowComparison(true)} onMouseUp={() => setShowComparison(false)} onMouseLeave={() => setShowComparison(false)}>
                        Hold to Compare
                     </Button>
                     <Button className="bg-primary shadow-gold rounded-full px-8" onClick={handleSaveLook} disabled={isSaving}>
                        <Download className="mr-2 h-4 w-4" /> Save Look
                     </Button>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm space-y-6">
                    <h3 className="font-serif text-lg border-b border-border pb-2">Fit Controls</h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-bold">Scale</label>
                          <span className="text-[10px] font-mono">{Math.round(overlayStyle.scale * 100)}%</span>
                        </div>
                        <input
                          type="range" min="0.5" max="2.5" step="0.01" value={overlayStyle.scale}
                          onChange={(e) => setOverlayStyle({...overlayStyle, scale: parseFloat(e.target.value)})}
                          className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-bold">Rotation</label>
                          <span className="text-[10px] font-mono">{overlayStyle.rotate}°</span>
                        </div>
                        <input
                          type="range" min="-45" max="45" step="1" value={overlayStyle.rotate}
                          onChange={(e) => setOverlayStyle({...overlayStyle, rotate: parseInt(e.target.value)})}
                          className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-bold">Brightness</label>
                          <span className="text-[10px] font-mono">{overlayStyle.brightness}</span>
                        </div>
                        <input
                          type="range" min="0.7" max="1.3" step="0.05" value={overlayStyle.brightness}
                          onChange={(e) => setOverlayStyle({...overlayStyle, brightness: parseFloat(e.target.value)})}
                          className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[10px] uppercase tracking-widest font-bold">Contrast</label>
                          <span className="text-[10px] font-mono">{overlayStyle.contrast}</span>
                        </div>
                        <input
                          type="range" min="0.8" max="1.3" step="0.05" value={overlayStyle.contrast}
                          onChange={(e) => setOverlayStyle({...overlayStyle, contrast: parseFloat(e.target.value)})}
                          className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="pt-2 grid grid-cols-2 gap-2">
                        <Button
                          variant="outline" size="sm"
                          onClick={() => setOverlayStyle(prev => ({ ...prev, isFlipped: !prev.isFlipped }))}
                        >
                          <FlipHorizontal className="h-4 w-4 mr-2" /> Flip
                        </Button>
                        <select
                          className="bg-background border border-border rounded-md px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                          value={overlayStyle.blendMode}
                          onChange={(e) => setOverlayStyle(prev => ({ ...prev, blendMode: e.target.value }))}
                        >
                          <option value="normal">Natural</option>
                          <option value="multiply">Fabric Shadow</option>
                          <option value="screen">Light Fabric</option>
                          <option value="overlay">Deep Blend</option>
                        </select>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-[10px] uppercase tracking-widest font-bold"
                        onClick={autoAlignProduct}
                      >
                        <RefreshCw className="h-3 w-3 mr-2" /> Reset Fit
                      </Button>
                    </div>
                  </div>

                  {sizeConfidence && (
                    <div className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg">Size Confidence</h3>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">
                          {sizeConfidence.fit}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {sizeConfidence.note}
                      </p>
                    </div>
                  )}

                  <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl space-y-3">
                    <h4 className="font-serif text-sm flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" /> Pro Tips
                    </h4>
                    <ul className="text-[10px] space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
                      <li>Use "Fabric Shadow" blend mode for natural shadows.</li>
                      <li>Drag the item to align it perfectly with your body.</li>
                      <li>Studio Mode adds professional lighting effects.</li>
                    </ul>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => toast.info("Sharing coming soon!")}>
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
