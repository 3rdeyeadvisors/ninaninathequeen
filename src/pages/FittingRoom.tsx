
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, User, Move, Trash2, Download, Sparkles,
  Share2, Loader2, FlipHorizontal, Camera,
  ArrowLeft, CheckCircle2, AlertCircle, Info,
  RefreshCw, ChevronRight, Maximize2
} from 'lucide-react';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';

// MediaPipe imports
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import { Pose, Results } from '@mediapipe/pose';

type FittingRoomStep = 'START' | 'METHOD' | 'CAMERA' | 'UPLOAD' | 'VALIDATING' | 'FITTING';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export default function FittingRoom() {
  const { data: allProducts = [], isLoading } = useProducts(100);
  const [step, setStep] = useState<FittingRoomStep>('START');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    blendMode: 'multiply' as GlobalCompositeOperation
  });

  const poseRef = useRef<Pose | null>(null);

  // Initialize MediaPipe Pose
  useEffect(() => {
    const initPose = async () => {
      await tf.ready();
      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseRef.current = pose;
    };

    initPose();
    return () => {
      poseRef.current?.close();
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
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

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const url = canvas.toDataURL('image/jpeg');
      setUserPhoto(url);
      stopCamera();
      validateImage(url);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUserPhoto(url);
      validateImage(url);
    }
  };

  const validateImage = async (imgUrl: string) => {
    setStep('VALIDATING');
    setValidationErrors([]);

    if (!poseRef.current) {
      // Wait a bit if pose is not ready
      await new Promise(r => setTimeout(r, 1000));
    }

    try {
      const img = new Image();
      img.src = imgUrl;
      await new Promise((resolve) => (img.onload = resolve));

      const results = await new Promise<Results>((resolve) => {
        poseRef.current!.onResults((results) => resolve(results));
        poseRef.current!.send({ image: img });
      });

      const errors: string[] = [];
      if (!results.poseLandmarks) {
        errors.push("No person detected in the image. Please stand in a clear, well-lit area.");
      } else {
        const landmarks = results.poseLandmarks;
        const visibleThreshold = 0.65; // Higher threshold for better accuracy

        const missingBodyParts = [];
        const isHeadVisible = landmarks[0].visibility! > visibleThreshold;
        const areShouldersVisible = landmarks[11].visibility! > visibleThreshold && landmarks[12].visibility! > visibleThreshold;
        const areHipsVisible = landmarks[23].visibility! > visibleThreshold && landmarks[24].visibility! > visibleThreshold;
        const areKneesVisible = landmarks[25].visibility! > visibleThreshold && landmarks[26].visibility! > visibleThreshold;
        const areAnklesVisible = landmarks[27].visibility! > visibleThreshold && landmarks[28].visibility! > visibleThreshold;

        if (!isHeadVisible) missingBodyParts.push("head");
        if (!areShouldersVisible) missingBodyParts.push("shoulders");
        if (!areHipsVisible) missingBodyParts.push("hips");
        if (!areKneesVisible) missingBodyParts.push("knees");
        if (!areAnklesVisible) missingBodyParts.push("ankles/feet");

        if (missingBodyParts.length > 0) {
          errors.push(`Incomplete silhouette. We couldn't clearly detect your ${missingBodyParts.join(', ')}.`);
        }

        // Check if the person is too small (too far away) or too large (too close)
        const torsoHeight = Math.abs(landmarks[11].y - landmarks[23].y);
        if (torsoHeight < 0.1) {
          errors.push("You appear too far away. Please move closer to the camera.");
        } else if (torsoHeight > 0.6) {
          errors.push("You are too close to the camera. Please stand back to show your full body.");
        }

        // Check alignment - ensure they are facing the camera
        const shoulderWidth = Math.abs(landmarks[11].x - landmarks[12].x);
        const hipWidth = Math.abs(landmarks[23].x - landmarks[24].x);
        if (shoulderWidth < 0.05 || hipWidth < 0.05) {
          errors.push("Please face the camera directly for the most accurate fit.");
        }

        // Check if too close to edges
        const edgePadding = 0.02;
        const isNearEdge = landmarks.some(p =>
          p.visibility! > visibleThreshold &&
          (p.x < edgePadding || p.x > 1 - edgePadding || p.y < edgePadding || p.y > 1 - edgePadding)
        );
        if (isNearEdge) {
          errors.push("Some body parts are too close to the edge or cut off. Center yourself in the frame.");
        }
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        playSound('remove');
      } else {
        playSound('success');
        autoAlignProduct(results);
        setStep('FITTING');
      }
    } catch (err) {
      console.error("Validation failed:", err);
      setValidationErrors(["An unexpected error occurred during image analysis."]);
    }
  };

  const autoAlignProduct = (results: Results) => {
    if (!results.poseLandmarks || !selectedProduct) return;

    const category = selectedProduct.category?.toLowerCase() || 'one-piece';
    const landmarks = results.poseLandmarks;
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Default values
    let topPercent = 30;
    let leftPercent = 25;
    let scale = 1.1;

    // Calculate midpoints and distances in normalized (0-1) coordinates
    const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
    const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    const hipMidX = (leftHip.x + rightHip.x) / 2;
    const hipMidY = (leftHip.y + rightHip.y) / 2;
    const hipWidth = Math.abs(leftHip.x - rightHip.x);

    // Refined placement logic
    if (category.includes('top')) {
      // Tops should be centered between shoulders and extend down to waist
      leftPercent = (shoulderMidX * 100);
      topPercent = (shoulderMidY * 100);
      scale = (shoulderWidth * 3.8); // Slightly larger for better coverage
    } else if (category.includes('bottom')) {
      // Bottoms should be centered between hips
      leftPercent = (hipMidX * 100);
      topPercent = (hipMidY * 100);
      scale = (hipWidth * 3.5);
    } else {
      // One-pieces / Bodysuits
      leftPercent = (shoulderMidX * 100);
      topPercent = (shoulderMidY * 100);
      const torsoHeight = Math.abs(hipMidY - shoulderMidY);
      scale = (torsoHeight * 3.2);
    }

    // Adjust leftPercent based on width of the overlay
    // The overlay is positioned by its top-left corner, so we subtract half its expected width
    const containerWidth = canvasContainerRef.current?.clientWidth || 450;
    const containerHeight = canvasContainerRef.current?.clientHeight || 600;

    // Convert normalized leftPercent back to pixels
    const targetLeft = (leftPercent / 100) * containerWidth - (overlayStyle.width * scale / 2);
    const targetTop = (topPercent / 100) * containerHeight - (category.includes('bottom') ? 20 : 0);

    setOverlayStyle(prev => ({
      ...prev,
      top: targetTop,
      left: targetLeft,
      scale: Math.max(0.4, Math.min(3.0, scale)),
      rotate: 0,
      isFlipped: false,
      blendMode: 'multiply'
    }));
  };

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

      // The UI center point is invariant during scaling from center
      const centerX = (overlayStyle.left - offsetX + overlayStyle.width / 2) * scaleFactor;
      const centerY = (overlayStyle.top - offsetY + (overlayStyle.width * (productImg.height / productImg.width)) / 2) * scaleFactor;

      ctx.translate(centerX, centerY);
      ctx.rotate((overlayStyle.rotate * Math.PI) / 180);
      if (overlayStyle.isFlipped) ctx.scale(-1, 1);
      ctx.globalCompositeOperation = overlayStyle.blendMode;
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
                    <Badge variant="secondary">Max 10MB</Badge>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <Button variant="ghost" onClick={() => setStep('METHOD')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Change Method
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'VALIDATING' && (
              <motion.div
                key="validating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-md mx-auto text-center space-y-8 py-20"
              >
                <div className="relative">
                  <div className="h-40 w-40 border-4 border-primary/20 rounded-full mx-auto" />
                  <motion.div
                    className="absolute inset-0 h-40 w-40 border-t-4 border-primary rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="font-serif text-3xl">Analyzing Image</h2>
                  <p className="text-muted-foreground animate-pulse">Detecting silhouette and checking usability...</p>
                </div>

                {validationErrors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-red-50 border border-red-100 rounded-2xl space-y-4"
                  >
                    <div className="flex items-center gap-2 text-red-600 justify-center">
                      <AlertCircle className="h-5 w-5" />
                      <h4 className="font-bold uppercase text-xs tracking-widest">Image Not Usable</h4>
                    </div>
                    <ul className="text-sm text-red-600 space-y-2 list-disc list-inside text-left">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={() => setStep('METHOD')}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                  </motion.div>
                )}
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
                          className={`w-full h-full object-contain transition-all duration-700 ${
                            studioMode ? 'filter blur-[2px] brightness-115 contrast-95' : ''
                          }`}
                        />
                        {studioMode && (
                          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-white/30 pointer-events-none" />
                        )}

                        <motion.div
                          key={selectedProduct?.id}
                          drag
                          dragMomentum={false}
                          onDragEnd={(_, info) => {
                            setOverlayStyle(prev => ({ ...prev, left: prev.left + info.offset.x, top: prev.top + info.offset.y }));
                          }}
                          className="absolute cursor-move z-20"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{
                            opacity: showComparison ? 0 : 1,
                            top: overlayStyle.top,
                            left: overlayStyle.left,
                            scale: overlayStyle.scale,
                            rotate: overlayStyle.rotate,
                            scaleX: overlayStyle.isFlipped ? -1 : 1,
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          style={{ width: overlayStyle.width, mixBlendMode: overlayStyle.blendMode as any }}
                        >
                          <img
                            src={selectedProduct?.images[0]?.url}
                            alt="Try on"
                            className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                            style={{ filter: 'contrast(1.05) saturate(1.1)' }}
                          />
                        </motion.div>
                      </div>
                    )}

                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                       <Badge variant="outline" className="bg-black/20 backdrop-blur-md text-white border-white/20 px-4 py-2 uppercase tracking-widest text-[8px]">AI Precise Alignment</Badge>
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
                          type="range" min="0.5" max="2" step="0.01" value={overlayStyle.scale}
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

                      <div className="pt-2 flex gap-2">
                        <Button
                          variant="outline" size="sm" className="flex-1"
                          onClick={() => setOverlayStyle(prev => ({ ...prev, isFlipped: !prev.isFlipped }))}
                        >
                          <FlipHorizontal className="h-4 w-4 mr-2" /> Flip
                        </Button>
                        <select
                          className="bg-background border border-border rounded-md px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                          value={overlayStyle.blendMode}
                          onChange={(e) => setOverlayStyle(prev => ({ ...prev, blendMode: e.target.value as any }))}
                        >
                          <option value="normal">Normal</option>
                          <option value="multiply">Multiply</option>
                          <option value="screen">Screen</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl space-y-3">
                    <h4 className="font-serif text-sm flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" /> Pro Tips
                    </h4>
                    <ul className="text-[10px] space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
                      <li>Use "Multiply" blend mode for natural fabric shadows.</li>
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
