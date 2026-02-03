
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Package, Gift, Share2, Camera, LogOut } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Account() {
  const [user, setUser] = useState({
    name: 'Isabella Silva',
    email: 'isabella@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    points: 250,
    referralCode: 'NINA-ISA-2025'
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile updated successfully!");
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(`https://ninaarmend.com/invite/${user.referralCode}`);
    toast.success("Referral link copied to clipboard!");
  };

  const mockOrders = [
    { id: '#NA-7829', date: 'May 15, 2025', status: 'Delivered', total: '$160.00' },
    { id: '#NA-7542', date: 'April 02, 2025', status: 'Delivered', total: '$85.00' },
  ];

  return (
    <div className="min-h-screen bg-secondary/10">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Sidebar / Profile Summary */}
            <Card className="w-full md:w-80 shrink-0">
              <CardContent className="pt-8 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <Camera className="h-4 w-4" />
                    <input type="file" className="hidden" onChange={() => toast.success("Avatar upload simulated")} />
                  </label>
                </div>
                <h2 className="font-serif text-2xl">{user.name}</h2>
                <p className="text-sm text-muted-foreground mb-6">{user.email}</p>

                <div className="grid grid-cols-2 gap-4 border-t pt-6">
                  <div className="text-center">
                    <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground">Orders</p>
                    <p className="font-serif text-lg">{mockOrders.length}</p>
                  </div>
                  <div className="text-center border-l">
                    <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground">Points</p>
                    <p className="font-serif text-lg">{user.points}</p>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t">
                 <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-serif">Account Details</CardTitle>
                      <CardDescription>Update your personal information and contact details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Full Name</label>
                            <Input defaultValue={user.name} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Email Address</label>
                            <Input defaultValue={user.email} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Shipping Address</label>
                          <Input defaultValue="Rua Dias Ferreira, 123, Leblon" />
                        </div>
                        <Button type="submit" className="bg-primary">Save Changes</Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="orders">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-serif">Order History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.id}</TableCell>
                              <TableCell>{order.date}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans tracking-wider uppercase bg-emerald-100 text-emerald-800">
                                  {order.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">{order.total}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rewards">
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-primary/20 to-secondary border-primary/20">
                      <CardHeader>
                        <CardTitle className="font-serif text-2xl">Inner Circle Rewards</CardTitle>
                        <CardDescription className="text-foreground/70">You have <span className="text-primary font-bold text-lg">{user.points}</span> Referral Points</CardDescription>
                      </CardHeader>
                      <CardContent>
                         <p className="text-sm mb-6">Redeem your points for exclusive discounts and early access to new collections.</p>
                         <div className="flex gap-4">
                            <Button className="bg-primary text-primary-foreground">Redeem Points</Button>
                            <Button variant="outline">Learn More</Button>
                         </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="font-serif">Refer a Friend</CardTitle>
                        <CardDescription>Give $20, Get 100 Points. Share your love for Nina Armend.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-secondary p-3 rounded-lg text-sm font-mono flex items-center justify-between border">
                            https://ninaarmend.com/invite/{user.referralCode}
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
