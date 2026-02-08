
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Package, Gift, Share2, Camera, LogOut, Lock, Eye, EyeOff, UserPlus, Trash2, AlertCircle, LayoutDashboard, Heart, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore, ADMIN_EMAIL } from '@/stores/authStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { playSound } from '@/lib/sounds';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCT_SIZES } from '@/lib/constants';
import { lovable } from '@/integrations/lovable/index';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';

export default function Account() {
  const { user, isAuthenticated, login, signup, logout, updateProfile, resetPassword, deleteAccount } = useAuthStore();
  const cloudAuth = useCloudAuthStore();
  const { items: wishlistItems, removeItem: removeFromWishlist } = useWishlistStore();
  const [showPassword, setShowPassword] = useState(false);
  const [preferredSize, setPreferredSize] = useState(user?.preferredSize || '');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Initialize cloud auth on mount
  useEffect(() => {
    cloudAuth.initialize();
  }, []);

  const points = user?.points || 0;
  const getTier = (pts: number) => {
    if (pts >= 1000) return 'Gold';
    if (pts >= 500) return 'Silver';
    return 'Bronze';
  };

  const nextTier = points >= 1000 ? 'Gold' : points >= 500 ? 'Gold' : 'Silver';
  const nextTierPoints = points >= 1000 ? 1000 : points >= 500 ? 1000 : 500;
  const pointsToNextTier = Math.max(0, nextTierPoints - points);
  const currentTier = getTier(points);

  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + '/account',
      });
      if (error) {
        toast.error("Google sign-in failed. Please try again.");
        console.error('Google sign-in error:', error);
      }
    } catch (err) {
      toast.error("Google sign-in failed. Please try again.");
      console.error('Google sign-in error:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;

    updateProfile({ name, preferredSize });
    playSound('success');
    toast.success("Profile updated successfully!");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      const success = await login(loginEmail, loginPassword);
      if (success) {
        toast.success(`Welcome back!`);
      } else {
        toast.error("Invalid email or password. Please try again.");
      }
    } else {
      toast.error("Please fill in both email and password.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetEmail) {
      const success = resetPassword(resetEmail);
      if (success) {
        toast.success(`If an account exists for ${resetEmail}, a password reset link has been sent.`);
        setIsResetDialogOpen(false);
        setResetEmail('');
      } else {
        toast.error("Could not find an account with that email address.");
      }
    }
  };

  const handleDeleteAccount = () => {
    if (user?.email) {
      const success = deleteAccount(user.email);
      if (success) {
        toast.success("Your account has been permanently deleted.");
      } else {
        toast.error("An error occurred while deleting your account.");
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupName && signupEmail && signupPassword) {
      const success = await signup(signupName, signupEmail, signupPassword);
      if (success) {
        toast.success("Welcome to Nina Armend! Your account has been created.");
      } else {
        toast.error("This email is already registered. Please sign in instead.");
      }
    } else {
      toast.error("Please fill in all required fields.");
    }
  };

  const copyReferralLink = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(`https://ninaarmend.com/invite/${user.referralCode}`);
      toast.success("Referral link copied to clipboard!");
    }
  };

  const mockOrders = [
    { id: '#NA-7829', date: 'May 15, 2025', status: 'Delivered', total: '$160.00' },
    { id: '#NA-7542', date: 'April 02, 2025', status: 'Delivered', total: '$85.00' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-secondary/10">
        <Header />
        <main className="pt-32 md:pt-40 pb-20">
          <div className="container mx-auto px-4 max-w-md">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Card className="border-primary/10 shadow-xl">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
                    <CardDescription>Enter your credentials to access your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Email Address</label>
                        <Input
                          type="email"
                          placeholder="isabella@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Password</label>
                          <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                            <DialogTrigger asChild>
                              <button type="button" className="text-[10px] font-sans tracking-wider uppercase text-primary hover:underline">
                                Forgot Password?
                              </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card border-primary/20">
                              <DialogHeader>
                                <DialogTitle className="font-serif text-2xl">Reset Password</DialogTitle>
                                <DialogDescription>
                                  Enter your email address and we'll send you a link to reset your password.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Email Address</label>
                                  <Input
                                    type="email"
                                    placeholder="isabella@example.com"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                    className="bg-background"
                                  />
                                </div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                                  Send Reset Link
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                        Sign In
                      </Button>
                      
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground font-sans tracking-widest">
                            Or continue with
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                      >
                        {isGoogleLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                        )}
                        Sign in with Google
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card className="border-primary/10 shadow-xl">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-serif text-2xl">Join Nina Armend</CardTitle>
                    <CardDescription>Create your account and earn 250 welcome points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Full Name</label>
                        <Input
                          type="text"
                          placeholder="Isabella Silva"
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Email Address</label>
                        <Input
                          type="email"
                          placeholder="isabella@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Password</label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                        Create Account
                      </Button>
                      
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground font-sans tracking-widest">
                            Or continue with
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                      >
                        {isGoogleLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                        )}
                        Sign up with Google
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/10">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Sidebar / Profile Summary */}
            <Card className="w-full md:w-80 shrink-0 border-primary/10">
              <CardContent className="pt-8 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <Camera className="h-4 w-4" />
                    <input type="file" className="hidden" onChange={() => toast.success("Avatar upload simulated")} />
                  </label>
                </div>
                <h2 className="font-serif text-2xl">{user?.name}</h2>
                {user?.role && (
                  <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-primary font-bold mb-1">
                    {user.role}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-6">{user?.email}</p>

                <div className="grid grid-cols-2 gap-4 border-t pt-6">
                  <div className="text-center p-3 bg-secondary/30 rounded-xl">
                    <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-muted-foreground mb-1">Orders</p>
                    <p className="font-serif text-xl font-bold">{mockOrders.length}</p>
                  </div>
                  <div className="text-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-primary mb-1">Points</p>
                    <p className="font-serif text-xl font-bold text-primary">{user?.points || 0}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2 text-left">
                  <div className="flex justify-between text-[10px] font-sans tracking-wider uppercase">
                    <span>{currentTier} Status</span>
                    <span className="text-primary">{points} / {nextTierPoints}</span>
                  </div>
                  <Progress value={(points / nextTierPoints) * 100} className="h-1.5" />
                  <p className="text-[9px] text-muted-foreground text-center italic">
                    {pointsToNextTier > 0
                      ? `${pointsToNextTier} points until ${nextTier} Status`
                      : 'You have reached Gold Status!'}
                  </p>
                </div>
              </CardContent>
              <div className="p-4 border-t space-y-2">
                 {user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
                   <Link to="/admin">
                     <Button
                       variant="outline"
                       className="w-full justify-start border-primary/20 text-primary hover:bg-primary/5 mb-2"
                     >
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Admin Dashboard
                     </Button>
                   </Link>
                 )}
                 <Button
                   variant="ghost"
                   onClick={logout}
                   className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                 >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                 </Button>
              </div>
            </Card>

            {/* Main Content Area */}
            <div className="flex-1 w-full">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="bg-background border w-full justify-center h-12 mb-6 overflow-x-auto no-scrollbar">
                  <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" onClick={() => playSound('click')}>
                    <User className="h-4 w-4 mr-2" /> Profile
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" onClick={() => playSound('click')}>
                    <Package className="h-4 w-4 mr-2" /> Orders
                  </TabsTrigger>
                  <TabsTrigger value="wishlist" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" onClick={() => playSound('click')}>
                    <Heart className="h-4 w-4 mr-2" /> Wishlist
                  </TabsTrigger>
                  <TabsTrigger value="rewards" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" onClick={() => playSound('click')}>
                    <Gift className="h-4 w-4 mr-2" /> Rewards
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                <TabsContent value="profile">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                  <Card className="border-primary/10">
                    <CardHeader>
                      <CardTitle className="font-serif">Account Details</CardTitle>
                      <CardDescription>Update your personal information and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Full Name</label>
                            <Input name="name" defaultValue={user?.name} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Email Address</label>
                            <Input name="email" defaultValue={user?.email} readOnly className="bg-secondary/50 cursor-not-allowed" />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Default Size</label>
                            <Select value={preferredSize} onValueChange={setPreferredSize}>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent>
                                {PRODUCT_SIZES.map(size => (
                                  <SelectItem key={size} value={size}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Shipping Address</label>
                            <Input defaultValue="Rua Dias Ferreira, 123, Leblon" />
                          </div>
                        </div>
                        <Button type="submit" className="bg-primary hover:bg-primary/90">Save Changes</Button>
                      </form>

                      <div className="mt-12 pt-8 border-t border-destructive/20">
                        <h4 className="text-destructive font-serif text-lg mb-2 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" /> Danger Zone
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-destructive/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif text-2xl">Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account
                                and remove your data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-secondary">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="orders">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                  <Card className="border-primary/10">
                    <CardHeader>
                      <CardTitle className="font-serif">Order History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockOrders.map((order) => (
                          <div key={order.id} className="p-4 border border-primary/5 bg-secondary/10 rounded-2xl group hover:border-primary/20 transition-all">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-background rounded-xl flex items-center justify-center border shadow-sm">
                                  <Package className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <p className="font-sans font-bold text-sm uppercase tracking-tight">{order.id}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{order.date}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right">
                                  <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Status</p>
                                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none text-[9px] uppercase tracking-widest px-2 py-0">
                                    {order.status}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Total</p>
                                  <p className="font-serif font-bold text-lg">{order.total}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="text-primary font-sans text-[10px] uppercase tracking-widest group-hover:bg-primary/5" onClick={() => toast.info(`Order ${order.id} details coming soon!`)}>
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="wishlist">
                   <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                  <Card className="border-primary/10">
                    <CardHeader>
                      <CardTitle className="font-serif">My Wishlist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {wishlistItems.length === 0 ? (
                        <div className="text-center py-12">
                          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                          <p className="text-muted-foreground font-sans">Your wishlist is empty.</p>
                          <Button asChild variant="link" className="text-primary mt-2">
                            <Link to="/shop">Go Shopping</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {wishlistItems.map((item) => (
                            <div key={item.id} className="flex gap-4 p-4 border rounded-2xl group hover:border-primary/30 transition-all">
                              <img src={item.image} alt={item.title} className="w-16 h-20 object-cover rounded-lg" />
                              <div className="flex-1 min-w-0">
                                <p className="font-sans font-bold text-sm truncate">{item.title}</p>
                                <p className="font-serif text-sm text-primary mb-2">${item.price}</p>
                                <div className="flex gap-2">
                                  <Button asChild size="sm" className="h-7 text-[10px] px-3">
                                    <Link to={`/product/${item.handle}`}>View</Link>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] px-3 text-destructive"
                                    onClick={() => {
                                      removeFromWishlist(item.id);
                                      playSound('remove');
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  </motion.div>
                </TabsContent>

                <TabsContent value="rewards">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/30 border-primary/20 shadow-xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <Gift className="h-32 w-32 rotate-12" />
                      </div>
                      <CardHeader className="relative z-10">
                        <Badge className="w-fit mb-2 bg-primary text-primary-foreground">{currentTier} Member</Badge>
                        <CardTitle className="font-serif text-3xl">Inner Circle Rewards</CardTitle>
                        <CardDescription className="text-foreground/70">You're on your way to exclusive Brazilian luxury perks.</CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                         <div className="bg-background/60 backdrop-blur-md border border-primary/10 p-6 rounded-2xl mb-6">
                            <div className="flex justify-between items-end mb-4">
                               <div>
                                  <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Available Points</p>
                                  <p className="text-4xl font-serif font-bold text-primary">{points}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Lifetime Earned</p>
                                  <p className="text-xl font-serif font-medium">{Math.max(1250, points + 500).toLocaleString()}</p>
                               </div>
                            </div>
                            <Progress value={(points / nextTierPoints) * 100} className="h-2 mb-2" />
                            <div className="flex justify-between text-[10px] font-sans tracking-widest uppercase text-muted-foreground">
                               <span>0</span>
                               <span>{nextTierPoints} pts for ${nextTierPoints === 500 ? '25' : '50'} reward</span>
                            </div>
                         </div>

                         <div className="flex flex-wrap gap-4">
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold" onClick={() => toast.info("Points redemption available in the mobile app")}>
                               <Gift className="h-4 w-4 mr-2" />
                               Redeem for $25 Off
                            </Button>
                            <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/5" onClick={() => toast.info("Loyalty program details coming soon")}>
                               Benefit Tiers
                            </Button>
                         </div>
                      </CardContent>
                    </Card>

                    <Card className="border-primary/10 shadow-sm">
                      <CardHeader>
                        <CardTitle className="font-serif">Refer a Friend</CardTitle>
                        <CardDescription>Give $20, Get 100 Points. Share your love for Nina Armend.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-secondary p-3 rounded-lg text-sm font-mono flex items-center justify-between border">
                            https://ninaarmend.com/invite/{user?.referralCode}
                          </div>
                          <Button onClick={copyReferralLink} size="icon" className="shrink-0">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  </motion.div>
                </TabsContent>
                </AnimatePresence>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
