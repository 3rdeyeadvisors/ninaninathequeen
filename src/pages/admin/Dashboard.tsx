
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, DollarSign, Package, LayoutDashboard, Settings, Brain, Sparkles, MessageSquare, Upload, Loader2, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useAdminStore } from '@/stores/adminStore';
import { useAuthStore } from '@/stores/authStore';

const data = [
  { name: 'Mon', sales: 4000, traffic: 2400 },
  { name: 'Tue', sales: 3000, traffic: 3398 },
  { name: 'Wed', sales: 5000, traffic: 9800 },
  { name: 'Thu', sales: 2780, traffic: 3908 },
  { name: 'Fri', sales: 4890, traffic: 4800 },
  { name: 'Sat', sales: 6390, traffic: 7800 },
  { name: 'Sun', sales: 8490, traffic: 9300 },
];

export default function AdminDashboard() {
  const { orders } = useAdminStore();
  const { users } = useAuthStore();
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hello Lydia! How can I help you optimize your store today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mostViewed, setMostViewed] = useState<{id: string, title: string, views: number, image: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Load most viewed products
    const views = JSON.parse(localStorage.getItem('product_views') || '{}');
    const productInfo = JSON.parse(localStorage.getItem('tracked_products') || '{}');

    const sorted = Object.entries(views)
      .map(([id, count]) => ({
        id,
        views: count as number,
        title: productInfo[id]?.title || 'Unknown Product',
        image: productInfo[id]?.image || ''
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 4);

    setMostViewed(sorted);
  }, []);

  const totalRevenue = orders.reduce((acc, order) => {
    const val = parseFloat(order.total.replace('$', '').replace(',', ''));
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsAiTyping(true);

    // Simulated AI Logic
    setTimeout(() => {
      let aiResponse = "I'm analyzing that for you...";
      const msg = userMessage.toLowerCase();

      if (msg.includes('sales') || msg.includes('revenue')) {
        aiResponse = "Your sales are up 20.1% this month! The 'Copacabana' collection is your top performer, accounting for 35% of revenue. I suggest running a 'Complete the Set' promotion to increase Average Order Value.";
      } else if (msg.includes('inventory') || msg.includes('stock')) {
        aiResponse = "I've detected 12 items low in stock, primarily in size Small. I recommend placing a restock order for the 'Ipanema Top' in Metallic within the next 48 hours to avoid lost sales during the weekend peak.";
      } else if (msg.includes('marketing') || msg.includes('customer')) {
        aiResponse = "Your most engaged customers are currently in Miami and Los Angeles. I suggest a targeted Instagram campaign focusing on 'Beach Club Chic' aesthetics, as these regions have a 15% higher conversion rate for your luxury line.";
      } else if (msg.includes('price') || msg.includes('discount')) {
        aiResponse = "Based on competitor analysis, your 'Leblon' series is priced 10% below market average for similar Italian fabrics. You could increase the margin by $5 without impacting volume, or offer a 10% bundle discount for top/bottom pairs.";
      } else if (msg.includes('seo') || msg.includes('traffic') || msg.includes('google')) {
        aiResponse = "Your organic traffic from Google has grown 8% this week. To maximize this for the launch, ensure your 'Sustainability' page has updated meta tags for 'Ethical Luxury Swimwear'—this keyword is currently trending.";
      } else if (msg.includes('suggestion') || msg.includes('idea') || msg.includes('improve')) {
        aiResponse = "Here's an idea: Your 'Fitting Room' feature has a 65% engagement rate but only 12% of those users add to cart. Adding a 'Recommended for Your Shape' badge within the fitting room could boost conversions by up to 20%.";
      } else if (msg.includes('launch')) {
        aiResponse = "For the upcoming launch, I recommend a 'VIP Early Access' window for your top 100 loyalty point earners. This creates scarcity and rewards your most valuable customers, typically leading to a 30% faster sell-through rate.";
      } else {
        aiResponse = "That's a great question. Looking at your store data, my top recommendation today is to optimize the mobile checkout experience. 78% of your traffic is on mobile, but checkout completion is 5% lower than on desktop. Simplifying the address entry could bridge this gap.";
      }

      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      setIsAiTyping(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      toast.info(`Uploading ${file.name}...`);

      // Simulate processing
      setTimeout(() => {
        setIsUploading(false);
        toast.success("Spreadsheet analyzed! Inventory synced and 4 optimizations suggested.", {
          description: "Check the AI Insights section for details."
        });
        setChatMessages(prev => [...prev, {
          role: 'ai',
          text: `I've finished analyzing ${file.name}. I found 4 potential stock-outs for next month and updated the inventory for 24 items. You can see the full report in the Store Intelligence card.`
        }]);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-4">
          <AdminSidebar />

          {/* Main Content */}
          <main className="w-full space-y-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <h1 className="font-serif text-4xl tracking-tight">Store Overview</h1>
              <p className="text-muted-foreground text-sm max-w-md">Welcome back, Lydia. Here's what's happening with Nina Armend today.</p>
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-medium pt-2">Last updated: Just now</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/admin/orders" className="block hover:scale-[1.02] transition-transform">
                <Card className="shadow-lg border-primary/10 bg-gradient-to-br from-background to-primary/5 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center text-center py-6">
                    <div className="text-3xl font-serif mb-1">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-emerald-500 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" /> +20.1% from last month
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/orders" className="block hover:scale-[1.02] transition-transform">
                <Card className="shadow-lg border-primary/10 bg-gradient-to-br from-background to-primary/5 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Orders</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center text-center py-6">
                    <div className="text-3xl font-serif mb-1">{orders.length}</div>
                    <p className="text-xs text-emerald-500 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" /> +{Math.floor(orders.length * 1.5)}% from last month
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/customers" className="block hover:scale-[1.02] transition-transform">
                <Card className="shadow-lg border-primary/10 bg-gradient-to-br from-background to-primary/5 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Customers</CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center text-center py-6">
                    <div className="text-3xl font-serif mb-1">{users.length}</div>
                    <p className="text-xs text-emerald-500 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" /> +19% from last month
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/products" className="block hover:scale-[1.02] transition-transform">
                <Card className="shadow-lg border-primary/10 bg-gradient-to-br from-background to-primary/5 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Inventory Status</CardTitle>
                    <Package className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center text-center py-6">
                    <div className="text-3xl font-serif mb-1">842 Items</div>
                    <p className="text-xs text-amber-500 flex items-center mt-1">
                      12 items low in stock
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Data Integration Section */}
            <Card className="border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
              <CardContent className="flex flex-col items-center justify-center text-center py-10">
                <div className="p-4 bg-background rounded-full mb-4 shadow-sm">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl mb-2">Inventory Spreadsheet Upload</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md text-center">
                  Drag and drop your product CSV or Excel file here. Our AI will automatically sync your inventory and suggest optimizations.
                </p>
                <div className="flex gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    className="font-sans"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isUploading ? 'Uploading...' : 'Select File'}
                  </Button>
                  <Button
                    className="bg-primary font-sans"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze with AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-gold">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="p-2 bg-primary/10 rounded-lg">
                            <Brain className="h-5 w-5 text-primary" />
                         </div>
                         <div>
                            <CardTitle className="font-serif text-xl">Store Intelligence</CardTitle>
                            <CardDescription>Advanced AI-driven growth metrics</CardDescription>
                         </div>
                      </div>
                      <Badge variant="outline" className="animate-pulse bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Live AI Analysis
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <div className="flex flex-wrap gap-2">
                             {['Trending: Metallic', 'High Demand: S', 'Miami Hotspot', 'Gen Z Favorite'].map(tag => (
                               <Badge key={tag} className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/10 transition-colors">
                                 {tag}
                               </Badge>
                             ))}
                           </div>
                           <div className="p-4 bg-card border rounded-xl space-y-3">
                              <div className="flex items-center gap-2 text-primary">
                                 <Sparkles className="h-4 w-4" />
                                 <span className="text-xs font-sans tracking-widest uppercase font-bold text-gold">AI Predictive Growth</span>
                              </div>
                              <div className="h-[120px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={data.slice(0, 5)}>
                                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                                    <Tooltip
                                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                              <p className="text-[10px] text-muted-foreground text-center">Projected 24% revenue increase based on current trends</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="p-4 bg-card border rounded-xl space-y-3">
                              <div className="flex items-center gap-2 text-primary">
                                 <Package className="h-4 w-4" />
                                 <span className="text-xs font-sans tracking-widest uppercase font-bold">Optimization Log</span>
                              </div>
                              <ul className="space-y-2">
                                <li className="text-xs flex items-start gap-2">
                                  <div className="h-1 w-1 rounded-full bg-primary mt-1.5" />
                                  <span>Reduced stock risk for <strong>Ipanema Top</strong> by 12%</span>
                                </li>
                                <li className="text-xs flex items-start gap-2">
                                  <div className="h-1 w-1 rounded-full bg-primary mt-1.5" />
                                  <span>Automated price adjustment for <strong>Buzios Bottom</strong></span>
                                </li>
                                <li className="text-xs flex items-start gap-2">
                                  <div className="h-1 w-1 rounded-full bg-primary mt-1.5" />
                                  <span>New "Metallic" category suggested for Q3</span>
                                </li>
                              </ul>
                           </div>
                           <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-4">
                              <div className="p-2 bg-primary/10 rounded-full mt-1 text-primary">
                                 <MessageSquare className="h-4 w-4" />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-xs font-medium uppercase tracking-tighter">AI Concierge Note</p>
                                 <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    I've analyzed your latest spreadsheet. I recommend increasing inventory for Small sizes in metallic fabrics by 15% before the summer peak.
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Card className="flex flex-col">
                  <CardHeader className="text-center">
                     <CardTitle className="font-serif text-xl">Quick Actions</CardTitle>
                     <CardDescription>Common tasks for today</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                     <Button className="w-full justify-start font-sans h-12" variant="outline" asChild>
                        <Link to="/admin/orders">
                          <ShoppingBag className="h-4 w-4 mr-2" /> Process New Orders
                        </Link>
                     </Button>
                     <Button className="w-full justify-start font-sans h-12" variant="outline" asChild>
                        <Link to="/admin/pos">
                          <CreditCard className="h-4 w-4 mr-2" /> Open POS System
                        </Link>
                     </Button>
                     <Button className="w-full justify-start font-sans h-12" variant="outline" asChild>
                        <Link to="/admin/products">
                          <Package className="h-4 w-4 mr-2" /> Restock Low Inventory
                        </Link>
                     </Button>
                     <Button className="w-full justify-start font-sans h-12" variant="outline" asChild>
                        <Link to="/admin/customers">
                          <Users className="h-4 w-4 mr-2" /> Review Customer Audience
                        </Link>
                     </Button>
                     <div className="pt-4 mt-4 border-t flex flex-col h-[300px]">
                        <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-4">AI Concierge</p>
                        <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                           {chatMessages.map((msg, i) => (
                             <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                               <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] font-sans leading-relaxed ${
                                 msg.role === 'user'
                                 ? 'bg-primary text-primary-foreground rounded-tr-none'
                                 : 'bg-secondary text-foreground rounded-tl-none'
                               }`}>
                                 {msg.text}
                               </div>
                             </div>
                           ))}
                           {isAiTyping && (
                             <div className="flex justify-start">
                               <div className="bg-secondary p-3 rounded-2xl rounded-tl-none flex gap-1">
                                 <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce" />
                                 <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                 <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                               </div>
                             </div>
                           )}
                           <div ref={chatEndRef} />
                        </div>
                        <div className="relative mt-auto">
                           <input
                             type="text"
                             placeholder="Ask anything..."
                             value={chatInput}
                             onChange={(e) => setChatInput(e.target.value)}
                             onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                             className="w-full h-10 bg-secondary/50 rounded-full px-4 pr-12 text-xs border border-primary/10 focus:ring-1 focus:ring-primary outline-none font-sans"
                           />
                           <Button
                             size="icon"
                             className="absolute right-1 top-1 h-8 w-8 rounded-full"
                             onClick={handleSendMessage}
                             disabled={isAiTyping}
                           >
                              <Sparkles className="h-4 w-4" />
                           </Button>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Most Viewed Products */}
            {mostViewed.length > 0 && (
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Most Viewed Products</CardTitle>
                  <CardDescription>Items catching the most attention this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {mostViewed.map((product) => (
                      <div key={product.id} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-xl">
                        <img src={product.image} alt="" className="w-12 h-16 object-cover rounded-lg shadow-sm" />
                        <div>
                          <p className="text-xs font-serif font-bold truncate max-w-[120px]">{product.title}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{product.views} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0 text-center">
                  <CardTitle className="font-serif text-xl">Sales Performance</CardTitle>
                </CardHeader>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--primary))' }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <CardHeader className="px-0 pt-0 text-center">
                  <CardTitle className="font-serif text-xl">Store Traffic</CardTitle>
                </CardHeader>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted)/0.1)' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="traffic" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
