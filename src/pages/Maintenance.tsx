
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Instagram, Facebook, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminStore } from '@/stores/adminStore';

export default function Maintenance() {
  const { settings } = useAdminStore();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-2xl"
      >
        <div className="mb-12 scale-125 md:scale-150 transition-transform duration-500">
          <Logo />
        </div>

        <h1 className="font-serif text-4xl md:text-6xl mb-6 tracking-tight">Something Beautiful is Coming</h1>
        <p className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed mb-12">
          We are currently preparing our new collection of luxury Brazilian swimwear.
          Our digital atelier will be back shortly with exclusive pieces designed for the modern woman.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-16">
          <div className="flex items-center gap-4">
            {settings.instagramUrl && (
              <Button variant="ghost" size="icon" className="hover:text-primary transition-colors" asChild>
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-6 w-6" />
                </a>
              </Button>
            )}
            {settings.facebookUrl && (
              <Button variant="ghost" size="icon" className="hover:text-primary transition-colors" asChild>
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-6 w-6" />
                </a>
              </Button>
            )}
            {settings.contactEmail && (
              <Button variant="ghost" size="icon" className="hover:text-primary transition-colors" asChild>
                <a href={`mailto:${settings.contactEmail}`}>
                  <Mail className="h-6 w-6" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-border/30">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-sans">
            © {new Date().getFullYear()} NINA ARMEND • HANDCRAFTED IN BRAZIL
          </p>
        </div>
      </motion.div>
    </div>
  );
}
