import { Link } from 'react-router-dom';

export function CheckoutFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border/30 py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            <Link to="/privacy" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors font-sans">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors font-sans">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors font-sans">
              Contact Us
            </Link>
          </div>

          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-sans text-center md:text-right">
            © {currentYear} NINA ARMEND. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
