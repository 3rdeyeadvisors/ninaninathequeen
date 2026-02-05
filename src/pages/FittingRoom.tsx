
import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Upload, User, Maximize2, Move, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FittingRoom() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState(MOCK_PRODUCTS[0]);
  const [overlayStyle, setOverlayStyle] = useState({
    width: 200,
    top: 150,
    left: 100,
    scale: 1,
    rotate: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUserPhoto(url);
      toast.success("Photo uploaded! Now select a product to try on.");
    }
  };

  const resetOverlay = () => {
    setOverlayStyle({
      width: 200,
      top: 150,
      left: 100,
      scale: 1,
      rotate: 0
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Virtual Fitting Room</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              See how our collection looks on you. Upload a photo and overlay your favorite pieces.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Left: Product Selector */}
            <div className="space-y-6 bg-card border border-border/50 p-6 rounded-2xl shadow-sm">
              <h2 className="font-serif text-xl border-b border-border pb-4">Select Product</h2>
              <div className="grid grid-cols-2 gap-4">
                {MOCK_PRODUCTS.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => { setSelectedProduct(product); resetOverlay(); }}
                    className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                      selectedProduct.id === product.id ? 'border-primary' : 'border-transparent hover:border-primary/30'
                    }`}
                  >
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Center: Fitting Room Canvas */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative aspect-[3/4] bg-secondary/30 rounded-2xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center">
                {userPhoto ? (
                  <>
                    <img src={userPhoto} alt="User" className="w-full h-full object-cover" />

                    {/* Product Overlay */}
                    <motion.div
                      drag
                      dragMomentum={false}
                      className="absolute cursor-move"
                      style={{
                        width: overlayStyle.width,
                        top: overlayStyle.top,
                        left: overlayStyle.left,
                        scale: overlayStyle.scale,
                        rotate: overlayStyle.rotate
                      }}
                    >
                      <img
                        src={selectedProduct.images[0]}
                        alt="Try on"
                        className="w-full h-auto drop-shadow-2xl"
                        style={{ filter: 'multiply(1.1)' }} // Simple way to make it blend slightly
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Drag to reposition
                      </div>
                    </motion.div>
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
                <div className="bg-card border border-border/50 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setUserPhoto(null)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Photo
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">Scale</span>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={overlayStyle.scale}
                        onChange={(e) => setOverlayStyle({...overlayStyle, scale: parseFloat(e.target.value)})}
                        className="w-full accent-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">Rotate</span>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        step="1"
                        value={overlayStyle.rotate}
                        onChange={(e) => setOverlayStyle({...overlayStyle, rotate: parseInt(e.target.value)})}
                        className="w-full accent-primary"
                      />
                    </div>
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
