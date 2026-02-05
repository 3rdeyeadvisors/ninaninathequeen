
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { User, Package, Gift, Share2, Camera, LogOut, Lock, Eye, EyeOff, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export default function Account() {
  const { user, isAuthenticated, login, signup, logout, updateProfile, resetPassword, deleteAccount } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
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

    updateProfile({ name });
    toast.success("Profile updated successfully!");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      const success = login(loginEmail, loginPassword);
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

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupName && signupEmail && signupPassword) {
      const success = signup(signupName, signupEmail, signupPassword);
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
                    <span>Bronze Status</span>
                    <span className="text-primary">{(user?.points || 0)} / 500</span>
                  </div>
                  <Progress value={((user?.points || 0) / 500) * 100} className="h-1.5" />
                  <p className="text-[9px] text-muted-foreground text-center italic">250 points until Silver Status</p>
                </div>
              </CardContent>
              <div className="p-4 border-t">
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
                <TabsList className="bg-background border w-full justify-start h-12 mb-6">
                  <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <User className="h-4 w-4 mr-2" /> Profile
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Package className="h-4 w-4 mr-2" /> Orders
                  </TabsTrigger>
                  <TabsTrigger value="rewards" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Gift className="h-4 w-4 mr-2" /> Rewards
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
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
                        <div className="space-y-2">
                          <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Shipping Address</label>
                          <Input defaultValue="Rua Dias Ferreira, 123, Leblon" />
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
                </TabsContent>

                <TabsContent value="orders">
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
                </TabsContent>

                <TabsContent value="rewards">
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/30 border-primary/20 shadow-xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <Gift className="h-32 w-32 rotate-12" />
                      </div>
                      <CardHeader className="relative z-10">
                        <Badge className="w-fit mb-2 bg-primary text-primary-foreground">Bronze Member</Badge>
                        <CardTitle className="font-serif text-3xl">Inner Circle Rewards</CardTitle>
                        <CardDescription className="text-foreground/70">You're on your way to exclusive Brazilian luxury perks.</CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                         <div className="bg-background/60 backdrop-blur-md border border-primary/10 p-6 rounded-2xl mb-6">
                            <div className="flex justify-between items-end mb-4">
                               <div>
                                  <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Available Points</p>
                                  <p className="text-4xl font-serif font-bold text-primary">{user?.points || 0}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Lifetime Earned</p>
                                  <p className="text-xl font-serif font-medium">1,250</p>
                               </div>
                            </div>
                            <Progress value={((user?.points || 0) / 1000) * 100} className="h-2 mb-2" />
                            <div className="flex justify-between text-[10px] font-sans tracking-widest uppercase text-muted-foreground">
                               <span>0</span>
                               <span>1000 pts for $50 reward</span>
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
