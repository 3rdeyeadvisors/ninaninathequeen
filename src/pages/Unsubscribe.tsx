import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type UnsubscribeState = 'loading' | 'valid' | 'already_unsubscribed' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [state, setState] = useState<UnsubscribeState>('loading');
  const [isProcessing, setIsProcessing] = useState(false);

  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
          headers: { apikey: anonKey },
        });
        const data = await res.json();
        if (res.status === 404) {
          setState('invalid');
        } else if (data.valid === false && data.reason === 'already_unsubscribed') {
          setState('already_unsubscribed');
        } else if (data.valid) {
          setState('valid');
        } else {
          setState('invalid');
        }
      } catch {
        setState('error');
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setState('success');
      } else if (data?.reason === 'already_unsubscribed') {
        setState('already_unsubscribed');
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md w-full"
      >
        <div className="mb-12 scale-125">
          <Logo />
        </div>

        {state === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground font-sans">Validating your request...</p>
          </div>
        )}

        {state === 'valid' && (
          <div className="space-y-6">
            <AlertTriangle className="h-10 w-10 text-primary mx-auto" />
            <h1 className="font-serif text-2xl">Unsubscribe from Emails</h1>
            <p className="text-muted-foreground text-sm font-sans">
              Are you sure you want to unsubscribe? You'll no longer receive email notifications from Nina Armend.
            </p>
            <Button
              onClick={handleUnsubscribe}
              disabled={isProcessing}
              className="w-full max-w-xs mx-auto bg-primary hover:bg-primary/90 text-primary-foreground tracking-widest uppercase text-xs"
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                'Confirm Unsubscribe'
              )}
            </Button>
          </div>
        )}

        {state === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
            <h1 className="font-serif text-2xl">You've Been Unsubscribed</h1>
            <p className="text-muted-foreground text-sm font-sans">
              You won't receive any more email notifications from us. We're sorry to see you go.
            </p>
          </div>
        )}

        {state === 'already_unsubscribed' && (
          <div className="space-y-4">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto" />
            <h1 className="font-serif text-2xl">Already Unsubscribed</h1>
            <p className="text-muted-foreground text-sm font-sans">
              This email has already been unsubscribed. No further action is needed.
            </p>
          </div>
        )}

        {(state === 'invalid' || state === 'error') && (
          <div className="space-y-4">
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h1 className="font-serif text-2xl">{state === 'invalid' ? 'Invalid Link' : 'Something Went Wrong'}</h1>
            <p className="text-muted-foreground text-sm font-sans">
              {state === 'invalid'
                ? 'This unsubscribe link is invalid or has expired.'
                : "We couldn't process your request. Please try again later."}
            </p>
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-border/30">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-sans">
            © {new Date().getFullYear()} NINA ARMEND
          </p>
        </div>
      </motion.div>
    </div>
  );
}
