
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { PRODUCT_SIZES } from '@/lib/constants';

const steps = [
  {
    title: "How do you like your fit?",
    description: "Choose your preferred level of coverage and compression.",
    key: "fitPreference",
    options: [
      { label: "Second Skin", value: "tight", description: "Tight and secure for active swimming" },
      { label: "Just Right", value: "regular", description: "Classic comfortable fit" },
      { label: "Relaxed", value: "loose", description: "More room and comfort" }
    ]
  },
  {
    title: "Select your body type",
    description: "This helps us understand your silhouette better.",
    key: "bodyType",
    options: [
      { label: "Petite", value: "petite" },
      { label: "Athletic", value: "athletic" },
      { label: "Curvy", value: "curvy" },
      { label: "Hourglass", value: "hourglass" }
    ]
  }
];

export default function SizeQuiz() {
  const { updateProfile, isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [height, setHeight] = useState([165]); // cm
  const [weight, setWeight] = useState([60]); // kg
  const [result, setResult] = useState<string | null>(null);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult();
    }
  };

  const handlePrev = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const calculateResult = () => {
    // Simple logic for demonstration
    let size = "M";
    if (weight[0] < 45) size = "XS";
    else if (weight[0] < 55) size = "S";
    else if (weight[0] > 105) size = "2XL";
    else if (weight[0] > 90) size = "XL";
    else if (weight[0] > 75) size = "L";

    if (answers.fitPreference === 'tight') {
      const idx = PRODUCT_SIZES.indexOf(size as any);
      if (idx > 0) size = PRODUCT_SIZES[idx - 1];
    } else if (answers.fitPreference === 'loose') {
      const idx = PRODUCT_SIZES.indexOf(size as any);
      if (idx < PRODUCT_SIZES.length - 1) size = PRODUCT_SIZES[idx + 1];
    }

    setResult(size);
    if (isAuthenticated) {
      updateProfile({ preferredSize: size });
      toast.success(`Size ${size} has been saved to your profile!`, {
        position: 'top-center'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          {!result ? (
            <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-xl">
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-sans tracking-[0.2em] uppercase text-primary">Step {currentStep + 1} of {steps.length + 1}</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`h-1 w-8 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                  </div>
                </div>
                <h1 className="font-serif text-3xl mb-2">Find Your Perfect Fit</h1>
                <p className="text-muted-foreground">Take our 1-minute quiz to find the best size for your body type.</p>
              </div>

              <AnimatePresence mode="wait">
                {currentStep < steps.length ? (
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-serif mb-2">{steps[currentStep].title}</h2>
                      <p className="text-sm text-muted-foreground mb-6">{steps[currentStep].description}</p>

                      <RadioGroup
                        value={answers[steps[currentStep].key]}
                        onValueChange={(val) => setAnswers({...answers, [steps[currentStep].key]: val})}
                        className="grid gap-4"
                      >
                        {steps[currentStep].options.map((opt) => (
                          <div key={opt.value}>
                            <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                            <Label
                              htmlFor={opt.value}
                              className="flex flex-col items-start p-4 border rounded-xl cursor-pointer hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                            >
                              <span className="font-serif text-lg">{opt.label}</span>
                              {opt.description && <span className="text-xs text-muted-foreground mt-1">{opt.description}</span>}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="measurements"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                  >
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <Label className="text-lg font-serif">Height</Label>
                        <span className="text-primary font-sans">{height[0]} cm</span>
                      </div>
                      <Slider value={height} onValueChange={setHeight} min={140} max={200} step={1} />
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <Label className="text-lg font-serif">Weight</Label>
                        <span className="text-primary font-sans">{weight[0]} kg</span>
                      </div>
                      <Slider value={weight} onValueChange={setWeight} min={40} max={120} step={1} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between mt-12">
                <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handleNext}
                  disabled={currentStep < steps.length && !answers[steps[currentStep].key]}
                >
                  {currentStep === steps.length ? 'Get My Recommendation' : 'Next'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border/50 p-12 rounded-2xl shadow-xl text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Check className="h-10 w-10 text-primary" />
              </div>
              <h2 className="font-serif text-2xl mb-2">We found your fit!</h2>
              <p className="text-muted-foreground mb-8">Based on your silhouette and preferences, your recommended size is:</p>

              <div className="inline-block p-8 border-2 border-primary rounded-2xl mb-12">
                <span className="text-6xl font-serif text-primary">{result}</span>
              </div>

              <div className="flex flex-col gap-4">
                <Button size="lg" className="w-full bg-primary hover:bg-primary/90" asChild>
                  <a href="/shop">Shop Your Size</a>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {setResult(null); setCurrentStep(0);}}>
                  Retake Quiz
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
