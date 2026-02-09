
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
import { User, Package, Gift, Share2, Camera, LogOut, Lock, Eye, EyeOff, UserPlus, Trash2, AlertCircle, LayoutDashboard, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore, ADMIN_EMAIL } from '@/stores/authStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { playSound } from '@/lib/sounds';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCT_SIZES } from '@/lib/constants';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';

export default function Account() {
  // Legacy auth store - kept for profile data display only
  const { user: legacyUser, updateProfile } = useAuthStore();
  
  // Cloud Auth (Supabase) - used for all authentication
  const cloudAuth = useCloudAuthStore();
  
  const { items: wishlistItems, removeItem: removeFromWishlist } = useWishlistStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use Cloud Auth user, fallback to legacy for profile display
  const user = cloudAuth.user ? {
    name: cloudAuth.user.name || cloudAuth.user.email.split('@')[0],
    email: cloudAuth.user.email,
    avatar: cloudAuth.user.avatar,
    points: cloudAuth.user.points || legacyUser?.points || 0,
    referralCode: legacyUser?.referralCode,
    role: cloudAuth.user.isAdmin ? 'Admin' : legacyUser?.role,
    preferredSize: cloudAuth.user.preferredSize || legacyUser?.preferredSize,
  } : legacyUser;
  
  const isAuthenticated = cloudAuth.isAuthenticated;
  const isAdmin = cloudAuth.user?.isAdmin || false;
  
  const [preferredSize, setPreferredSize] = useState(user?.preferredSize || '');

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
    if (!loginEmail || !loginPassword) {
      toast.error("Please fill in both email and password.");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await cloudAuth.signInWithEmail(loginEmail, loginPassword);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          if (loginEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            toast.error("Admin account not found. If this is your first time logging in, please use the 'Sign Up' tab with your admin email to establish your account.", { duration: 6000 });
          } else {
            toast.error("Invalid email or password. If you haven't created an account yet, please Sign Up first.");
          }
        } else {
          toast.error(error.message || "Invalid email or password. Please try again.");
        }
      } else {
        toast.success(`Welcome back!`);
        setLoginEmail('');
        setLoginPassword('');
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetEmail) {
      // TODO: Implement Supabase password reset
      toast.success(`If an account exists for ${resetEmail}, a password reset link has been sent.`);
      setIsResetDialogOpen(false);
      setResetEmail('');
    }
  };

  const handleDeleteAccount = () => {
    // Account deletion should be handled through Cloud Auth
    toast.error("Please contact support to delete your account.");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await cloudAuth.signUpWithEmail(signupEmail, signupPassword, signupName);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message || "Could not create account. Please try again.");
        }
      } else {
        toast.success("Welcome to Nina Armend! Please check your email to verify your account.");
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await cloudAuth.signOut();
    toast.success("You have been signed out.");
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

  // Show loading state while checking auth
  if (cloudAuth.isLoading) {
    return (
      <div className="min-h-screen bg-secondary/10">
        <Header />
        <main className="pt-32 md:pt-40 pb-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

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
                          disabled={isLoading}
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
                            disabled={isLoading}
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
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
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
                          disabled={isLoading}
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
                          disabled={isLoading}
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
                            disabled={isLoading}
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Must be at least 6 characters</p>
                      </div>
                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
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
                 {isAdmin && (
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
                   onClick={handleLogout}
                   className="w-full justify-start text-muted-foreground hover:text-destructive"
                 >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                 </Button>
              </div>
            </Card>

            {/* Main Content Tabs */}
            <div className="flex-1 w-full">
              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="w-full grid grid-cols-4 mb-8 bg-secondary/30">
                  <TabsTrigger value="orders" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5">
                    <Package className="h-4 w-4" /> <span className="hidden sm:inline">Orders</span>
                  </TabsTrigger>
                  <TabsTrigger value="points" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5">
                    <Gift className="h-4 w-4" /> <span className="hidden sm:inline">Rewards</span>
                  </TabsTrigger>
                  <TabsTrigger value="wishlist" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5">
                    <Heart className="h-4 w-4" /> <span className="hidden sm:inline">Wishlist</span>
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5">
                    <User className="h-4 w-4" /> <span className="hidden sm:inline">Profile</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orders">
                  <Card className="border-primary/10">
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">Order History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px] uppercase tracking-widest">Order</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest">Date</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest">Status</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-widest text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.id}</TableCell>
                              <TableCell>{order.date}</TableCell>
                              <TableCell><Badge variant="outline" className="border-green-500/50 text-green-600">{order.status}</Badge></TableCell>
                              <TableCell className="text-right">{order.total}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="points">
                  <Card className="border-primary/10">
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">Rewards & Referrals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl">
                          <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-primary mb-2">Your Points</p>
                          <p className="font-serif text-5xl font-bold text-primary">{user?.points || 0}</p>
                          <p className="text-xs text-muted-foreground mt-2">Use points for discounts on your next order.</p>
                        </div>
                        <div className="p-6 bg-secondary/30 rounded-2xl">
                          <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-muted-foreground mb-2">Refer a Friend</p>
                          <p className="font-mono text-sm bg-card p-3 rounded-lg border border-border mb-4">{user?.referralCode}</p>
                          <Button variant="outline" size="sm" onClick={copyReferralLink} className="w-full">
                            <Share2 className="h-4 w-4 mr-2" /> Copy Referral Link
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="wishlist">
                  <Card className="border-primary/10">
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">Your Wishlist</CardTitle>
                      <CardDescription>Items you've saved for later</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {wishlistItems.length === 0 ? (
                        <div className="text-center py-12">
                          <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground">Your wishlist is empty.</p>
                          <Link to="/shop">
                            <Button variant="link" className="mt-2 text-primary">Explore Our Collection</Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <AnimatePresence>
                            {wishlistItems.map((item) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                layout
                                className="group relative bg-card rounded-xl overflow-hidden border border-border/50"
                              >
                                <Link to={`/product/${item.id}`}>
                                  <div className="aspect-square overflow-hidden">
                                    <img
                                      src={item.image}
                                      alt={item.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  </div>
                                  <div className="p-4">
                                    <h4 className="font-sans text-sm font-medium truncate">{item.title}</h4>
                                    <p className="text-primary font-semibold">{item.price}</p>
                                  </div>
                                </Link>
                                <button
                                  onClick={() => removeFromWishlist(item.id)}
                                  className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="profile">
                  <Card className="border-primary/10">
                    <CardHeader>
                      <CardTitle className="font-serif text-xl">Profile Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Full Name</label>
                            <Input name="name" defaultValue={user?.name} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Email Address</label>
                            <Input name="email" defaultValue={user?.email} disabled className="bg-muted/50" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Preferred Size</label>
                          <Select value={preferredSize} onValueChange={setPreferredSize}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your preferred size" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRODUCT_SIZES.map((size) => (
                                <SelectItem key={size} value={size}>{size}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button type="submit" className="bg-primary hover:bg-primary/90">
                          Save Changes
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card className="border-destructive/20 mt-6">
                    <CardHeader>
                      <CardTitle className="font-serif text-xl text-destructive flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Deleting your account is permanent and cannot be undone.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your
                              account and remove your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                              Delete Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
