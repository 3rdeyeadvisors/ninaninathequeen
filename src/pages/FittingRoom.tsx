
import { useState, useRef, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, User, Maximize2, Move, Trash2, RotateCcw, Download, Sparkles, Share2, Camera, Loader2, FlipHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';

export default function FittingRoom() {
  const { data: allProducts = [], isLoading } = useProducts(100);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');

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

  const [overlayStyle, setOverlayStyle] = useState({
    width: 200,
    top: 150,
    left: 100,
    scale: 1,
    rotate: 0,
    isFlipped: false,
    blendMode: 'normal' as GlobalCompositeOperation
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUserPhoto(url);
      playSound('success');
      toast.success("Photo uploaded! Now select a product to try on.");
    }
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

      // Load images
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

      // Set canvas size to user photo natural size for high quality
      canvas.width = userImg.width;
      canvas.height = userImg.height;

      // Draw user photo
      ctx.drawImage(userImg, 0, 0);

      // Calculate object-contain scaling
      const containerRatio = rect.width / rect.height;
      const imageRatio = userImg.width / userImg.height;

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

      // Map UI coordinates to canvas coordinates
      // 1. Subtract offset to get position relative to the displayed image start
      // 2. Multiply by scaleFactor to get natural resolution position
      const productRealWidth = overlayStyle.width * overlayStyle.scale * scaleFactor;
      const productRealHeight = (overlayStyle.width * (productImg.height / productImg.width)) * overlayStyle.scale * scaleFactor;

      const centerX = (overlayStyle.left - offsetX + (overlayStyle.width * overlayStyle.scale) / 2) * scaleFactor;
      const centerY = (overlayStyle.top - offsetY + (overlayStyle.width * (productImg.height / productImg.width) * overlayStyle.scale) / 2) * scaleFactor;

      ctx.translate(centerX, centerY);
      ctx.rotate((overlayStyle.rotate * Math.PI) / 180);
      if (overlayStyle.isFlipped) ctx.scale(-1, 1);

      ctx.globalCompositeOperation = overlayStyle.blendMode;

      ctx.drawImage(
        productImg,
        -productRealWidth / 2,
        -productRealHeight / 2,
        productRealWidth,
        productRealHeight
      );

      ctx.restore();

      // Download
      const link = document.createElement('a');
      link.download = `nina-armend-look-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success("Look saved to your gallery!", {
        description: "Your virtual fitting has been processed with AI enhancement.",
        icon: <Sparkles className="h-4 w-4 text-primary" />
      });
    } catch (error) {
      console.error("Error saving look:", error);
      toast.error("Failed to save look. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetOverlay = () => {
    setOverlayStyle({
      width: 200,
      top: 150,
      left: 100,
      scale: 1,
      rotate: 0,
      isFlipped: false,
      blendMode: 'normal'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-48 pb-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20 py-1 px-4 uppercase tracking-[0.2em] text-[10px]">AI-Powered Studio</Badge>
            <h1 className="font-serif text-5xl md:text-6xl mb-6 tracking-tight">Virtual Fitting Room</h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg font-serif italic">
              Experience Brazilian luxury from the comfort of your home. Upload your silhouette and find your perfect fit.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Left: Product Selector */}
            <div className="space-y-6 bg-card border border-border/50 p-6 rounded-2xl shadow-sm">
              <div className="border-b border-border pb-4">
                <h2 className="font-serif text-xl mb-4">Select Product</h2>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Top', 'Bottom', 'One-Piece'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                        categoryFilter === cat
                        ? 'bg-primary text-white border-primary'
                        : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {isLoading ? (
                  <div className="col-span-2 flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product);
                        resetOverlay();
                        playSound('click');
                      }}
                      className="group/item flex flex-col gap-2 text-left"
                    >
                      <div className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                        selectedProduct?.id === product.id ? 'border-primary shadow-md' : 'border-transparent group-hover/item:border-primary/30'
                      }`}>
                        <img src={product.images[0]?.url} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" />
                      </div>
                      <div className="px-1">
                        <p className="text-[10px] font-medium truncate uppercase tracking-tighter">{product.title}</p>
                        <p className="text-[10px] text-muted-foreground">${product.price.amount}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Center: Fitting Room Canvas */}
            <div className="lg:col-span-2 space-y-8">
              <div
                ref={canvasContainerRef}
                className="relative aspect-[3/4] bg-secondary/20 rounded-[2rem] border border-border/50 overflow-hidden flex items-center justify-center shadow-2xl group/canvas"
              >
                {userPhoto ? (
                  <>
                    <img src={userPhoto} alt="User" className="w-full h-full object-contain transition-transform duration-700 group-hover/canvas:scale-105" />

                    {/* Product Overlay */}
                    <motion.div
                      key={selectedProduct?.id}
                      drag
                      dragMomentum={false}
                      onDragEnd={(_, info) => {
                        setOverlayStyle(prev => ({
                          ...prev,
                          left: prev.left + info.offset.x,
                          top: prev.top + info.offset.y
                        }));
                      }}
                      className="absolute cursor-move z-20"
                      initial={false}
                      animate={{
                        top: overlayStyle.top,
                        left: overlayStyle.left,
                        scale: overlayStyle.scale,
                        rotate: overlayStyle.rotate,
                        scaleX: overlayStyle.isFlipped ? -1 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{
                        width: overlayStyle.width,
                        mixBlendMode: overlayStyle.blendMode as any
                      }}
                    >
                      <img
                        src={selectedProduct?.images[0]?.url}
                        alt="Try on"
                        className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                        style={{ filter: 'contrast(1.05) saturate(1.1)' }}
                      />
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary/90 backdrop-blur-md text-white text-[9px] px-3 py-1.5 rounded-full uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl border border-white/20 whitespace-nowrap">
                        <Move className="h-3 w-3 inline-block mr-1" /> Drag to Position
                      </div>
                    </motion.div>

                    {/* AI Processing Overlay */}
                    <AnimatePresence>
                      {isSaving && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
                        >
                           <div className="relative">
                              <div className="h-24 w-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                              <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
                           </div>
                           <p className="mt-6 font-serif text-xl animate-pulse">Enhancing your look...</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-serif text-xl mb-4">No Photo Uploaded</h3>
                    <Button onClick={() => fileInputRef.current?.click()} className="bg-primary">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Your Photo
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                )}
              </div>

              {/* Controls */}
              {userPhoto && (
                <div className="space-y-6">
                <div className="bg-card border border-border/50 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => { setUserPhoto(null); playSound('remove'); }}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Photo
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { fileInputRef.current?.click(); playSound('click'); }}>
                      <Upload className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-8">
                    <div className="flex flex-col gap-3 min-w-[140px]">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Scale</span>
                        <span className="text-[10px] font-mono text-primary">{Math.round(overlayStyle.scale * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.01"
                        value={overlayStyle.scale}
                        onChange={(e) => setOverlayStyle({...overlayStyle, scale: parseFloat(e.target.value)})}
                        className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col gap-3 min-w-[140px]">
                       <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Rotation</span>
                        <span className="text-[10px] font-mono text-primary">{overlayStyle.rotate}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={overlayStyle.rotate}
                        onChange={(e) => setOverlayStyle({...overlayStyle, rotate: parseInt(e.target.value)})}
                        className="w-full accent-primary h-1.5 bg-secondary rounded-full appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="h-10 w-px bg-border/50 hidden sm:block" />

                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className={overlayStyle.isFlipped ? "bg-primary/10 border-primary" : ""}
                        onClick={() => {
                          setOverlayStyle(prev => ({ ...prev, isFlipped: !prev.isFlipped }));
                          playSound('click');
                        }}
                      >
                        <FlipHorizontal className="h-4 w-4 mr-2" />
                        Flip
                      </Button>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Blend</span>
                        <select
                          className="bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                          value={overlayStyle.blendMode}
                          onChange={(e) => setOverlayStyle(prev => ({ ...prev, blendMode: e.target.value as any }))}
                        >
                          <option value="normal">Normal</option>
                          <option value="multiply">Multiply</option>
                          <option value="screen">Screen</option>
                          <option value="overlay">Overlay</option>
                        </select>
                      </div>
                    </div>

                    <div className="h-10 w-px bg-border/50 hidden sm:block" />

                    <div className="flex items-center gap-3">
                       <Button
                        onClick={handleSaveLook}
                        className="bg-primary hover:bg-primary/90 shadow-gold group"
                        disabled={isSaving}
                       >
                          <Download className="h-4 w-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                          Save Look
                       </Button>
                       <Button variant="outline" size="icon" onClick={() => toast.info("Sharing coming soon!")}>
                          <Share2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: "Full Body Photo", desc: "Use a head-to-toe photo for best results." },
                    { title: "Plain Background", desc: "Solid colors help the product stand out." },
                    { title: "Even Lighting", desc: "Avoid harsh shadows or backlighting." }
                  ].map((tip, i) => (
                    <div key={i} className="p-4 bg-card/50 border border-border/40 rounded-xl space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 rounded-full bg-primary/10 text-primary border-primary/20 text-[10px]">
                          {i + 1}
                        </Badge>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider">{tip.title}</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{tip.desc}</p>
                    </div>
                  ))}
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
