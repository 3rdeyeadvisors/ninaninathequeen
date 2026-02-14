
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Instagram, Facebook, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminStore } from '@/stores/adminStore';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const waitlistSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').max(255),
  name: z.string().trim().max(100).optional(),
});

export default function Maintenance() {
  const { settings } = useAdminStore();
  const { signInWithEmail } = useCloudAuthStore();

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Admin login state
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsed = waitlistSchema.safeParse({ email: waitlistEmail, name: waitlistName || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('waitlist' as any)
        .insert({ email: parsed.data.email, name: parsed.data.name || null } as any)
        .select('id')
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          toast.info("You're already on the waitlist! We'll notify you when we launch.");
          setIsJoined(true);
        } else {
          throw error;
        }
      } else {
        setIsJoined(true);
        toast.success("You're on the list! We'll let you know when we launch.");

        // Send confirmation email (fire-and-forget)
        supabase.functions.invoke('send-email', {
          body: {
            type: 'waitlist_confirmation',
            data: { email: parsed.data.email, name: parsed.data.name || 'there' },
          },
        }).catch(err => console.error('Waitlist confirmation email failed:', err));

        // Notify admin (fire-and-forget)
        supabase.functions.invoke('send-email', {
          body: {
            type: 'waitlist_notification',
            data: { email: parsed.data.email, name: parsed.data.name || 'Not provided' },
          },
        }).catch(err => console.error('Waitlist admin notification failed:', err));
      }
    } catch (err) {
      console.error('Waitlist signup error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) return;

    setIsLoggingIn(true);
    try {
      const { error } = await signInWithEmail(adminEmail, adminPassword);
      if (error) {
        toast.error('Invalid credentials. Please try again.');
      }
      // If successful, the MaintenanceGuard in App.tsx will detect admin status
      // and automatically bypass the maintenance page
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

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
        className="text-center z-10 max-w-2xl w-full"
      >
        <div className="mb-12 scale-125 md:scale-150 transition-transform duration-500">
          <Logo />
        </div>

        <h1 className="font-serif text-4xl md:text-6xl mb-6 tracking-tight">Something Beautiful is Coming</h1>
        <p className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed mb-12">
          We are currently preparing our new collection of luxury Brazilian swimwear.
          Our digital atelier will be back shortly with exclusive pieces designed for the modern woman.
        </p>

        {/* Waitlist Form */}
        <AnimatePresence mode="wait">
          {isJoined ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-12 p-8 border border-primary/20 rounded-2xl bg-primary/5"
            >
              <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-xl mb-2">You're on the List</h2>
              <p className="text-muted-foreground text-sm font-sans">
                We'll send you an exclusive preview before anyone else.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleWaitlistSubmit}
              className="mb-12 max-w-md mx-auto space-y-4"
            >
              <p className="text-sm font-sans uppercase tracking-[0.2em] text-primary mb-6">
                Join the Waitlist
              </p>
              <Input
                type="email"
                placeholder="Your email address *"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                required
                className="bg-background/50 border-border/50 rounded-xl h-12 text-center font-sans"
              />
              <Input
                type="text"
                placeholder="Your name (optional)"
                value={waitlistName}
                onChange={(e) => setWaitlistName(e.target.value)}
                className="bg-background/50 border-border/50 rounded-xl h-12 text-center font-sans"
                maxLength={100}
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl font-sans text-[10px] uppercase tracking-[0.3em]"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Notify Me'}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

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

          {/* Discreet Admin Access */}
          <div className="mt-6">
            <button
              onClick={() => setShowAdminLogin(!showAdminLogin)}
              className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
              aria-label="Admin access"
            >
              <Lock className="h-3.5 w-3.5 mx-auto" />
            </button>

            <AnimatePresence>
              {showAdminLogin && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAdminLogin}
                  className="mt-4 max-w-xs mx-auto space-y-3 overflow-hidden"
                >
                  <Input
                    type="email"
                    placeholder="Admin email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="bg-background/50 border-border/30 rounded-lg h-9 text-xs font-sans"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="bg-background/50 border-border/30 rounded-lg h-9 text-xs font-sans"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    disabled={isLoggingIn}
                    className="w-full text-[10px] uppercase tracking-widest h-9 font-sans"
                  >
                    {isLoggingIn ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Sign In'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
