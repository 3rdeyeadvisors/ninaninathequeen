import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, DollarSign, Package, Brain, Sparkles, MessageSquare, Upload, Loader2, BarChart3, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useAdminStore } from '@/stores/adminStore';
import { parseSpreadsheet } from '@/lib/spreadsheet';

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
  const { orders, customers, updateProductOverride } = useAdminStore();
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hello! How can I help you optimize your store today?" }
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

  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, order) => acc + parseFloat(order.total), 0);
  }, [orders]);

  const totalNetProfit = useMemo(() => {
    return orders.reduce((acc, order) => {
      const revenue = parseFloat(order.total);
      const shipping = parseFloat(order.shippingCost || '0');
      const cost = parseFloat(order.itemCost || '0');
      return acc + (revenue - shipping - cost);
    }, 0);
  }, [orders]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      let aiResponse = "I'm analyzing that for you...";
      const msg = userMessage.toLowerCase();

      if (msg.includes('sales') || msg.includes('revenue')) {
        aiResponse = "Your sales are up 20.1% this month! The 'Copacabana' collection is your top performer, accounting for 35% of revenue.";
      } else if (msg.includes('inventory') || msg.includes('stock')) {
        aiResponse = "I've detected 12 items low in stock, primarily in size Small. I recommend placing a restock order within the next 48 hours.";
      } else if (msg.includes('marketing') || msg.includes('customer')) {
        aiResponse = "Your most engaged customers are in Miami and Los Angeles. I suggest a targeted Instagram campaign focusing on 'Beach Club Chic' aesthetics.";
      } else {
        aiResponse = "Looking at your store data, my top recommendation today is to optimize the mobile checkout experience.";
      }

      setChatMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      setIsAiTyping(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      toast.info(`Analyzing ${file.name}...`);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as ArrayBuffer;
          const rows = parseSpreadsheet(data);
          let updatedCount = 0;

          rows.forEach((row, index) => {
            if (row.id || row.handle || row.title) {
              const id = String(row.id || `sync-${index}`);
              const sizes = row.sizes ? String(row.sizes).split('|').map((s: string) => s.trim().toUpperCase()) : undefined;

              let sizeInventory: Record<string, number> | undefined = undefined;
              if (row.size_inventory) {
                sizeInventory = {};
                String(row.size_inventory).split('|').forEach((part: string) => {
                  const [s, q] = part.split(':');
                  if (s && q) sizeInventory![s.trim().toUpperCase()] = parseInt(q.trim()) || 0;
                });
              }

              updateProductOverride(id, {
                title: row.title ? String(row.title) : undefined,
                price: row.price ? String(row.price) : undefined,
                inventory: row.inventory ? parseInt(row.inventory) : 0,
                sizes: sizes,
                sizeInventory: sizeInventory,
              });
              updatedCount++;
            }
          });

          setTimeout(() => {
            setIsUploading(false);
            toast.success(`Sync complete! ${updatedCount} products updated.`);
            setChatMessages(prev => [...prev, {
              role: 'ai',
              text: `I've finished analyzing ${file.name}. I've successfully synced inventory and pricing for ${updatedCount} items from your spreadsheet.`
            }]);
          }, 1500);
        } catch (error) {
          console.error('Spreadsheet parsing failed:', error);
          setIsUploading(false);
          toast.error("Failed to parse spreadsheet. Please ensure it's a valid CSV or Excel file.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "id,title,price,inventory,sizes,size_inventory\ngid://shopify/Product/1,Copacabana Top,85.00,50,XS|S|M|L|XL|2XL,XS:10|S:10|M:10|L:10|XL:5|2XL:5\ngid://shopify/Product/2,Copacabana Bottom,75.00,45,XS|S|M|L|XL|2XL,XS:8|S:8|M:8|L:8|XL:7|2XL:6\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nina_armend_inventory_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Template downloaded!");
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-8 lg:gap-12">
          <AdminSidebar />

          <main className="flex-1 space-y-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <h1 className="font-serif text-4xl tracking-tight">Store Overview</h1>
              <p className="text-muted-foreground text-sm max-w-md">Welcome back. Here's what's happening with your store today.</p>
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-medium pt-2">Last updated: Just now</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link to="/admin/orders" className="block hover:scale-[1.02] transition-transform">
                <Card className="shadow-lg border-primary/10 bg-gradient-to-br from-background to-primary/5 h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center text-center py-6">
                    <div className="text-2xl font-serif mb-1">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-[10px] text-emerald-500 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" /> +20.1% vs prev
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/orders" className="block hover:scale-[1.02] transition-transform">
                <Card className="shadow-lg border-primary/20 bg-gradient-to-br from-primary/5 to-background h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-sans tracking-widest uppercase text-primary">Net Profit</CardTitle>
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center text-center py-6">
                    <div className="text-2xl font-serif mb-1 text-primary">${totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-[10px] text-emerald-500 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" /> Healthy Margins
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
                    <div className="text-2xl font-serif mb-1">{orders.length}</div>
                    <p className="text-[10px] text-emerald-500 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" /> +12% vs prev
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
                    <div className="text-2xl font-serif mb-1">{customers.length}</div>
                    <p className="text-[10px] text-emerald-500 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" /> +19% vs prev
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Data Integration Section */}
              <Card className="border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors h-full flex items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center text-center py-8">
                  <div className="p-3 bg-background rounded-full mb-3 shadow-sm">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg mb-1.5">Spreadsheet Sync</h3>
                  <p className="text-muted-foreground text-[13px] mb-5 max-w-xs text-center">
                    Sync your product inventory with a CSV or Excel file. AI-powered optimization included.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-sans text-[10px] uppercase tracking-widest h-9"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                      {isUploading ? 'Analyzing...' : 'Sync Spreadsheet'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary font-sans text-[10px] uppercase tracking-widest h-9"
                      onClick={downloadTemplate}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions / Store Status */}
              <Card className="border-primary/10 bg-secondary/5 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 pt-2">
                   <Button variant="outline" className="h-16 flex flex-col gap-1 border-primary/10 hover:bg-primary/5" asChild>
                     <Link to="/admin/products">
                       <Package className="h-4 w-4 text-primary" />
                       <span className="text-[10px] uppercase tracking-widest">Add Product</span>
                     </Link>
                   </Button>
                   <Button variant="outline" className="h-16 flex flex-col gap-1 border-primary/10 hover:bg-primary/5" asChild>
                     <Link to="/admin/pos">
                       <DollarSign className="h-4 w-4 text-primary" />
                       <span className="text-[10px] uppercase tracking-widest">New Sale</span>
                     </Link>
                   </Button>
                   <Button variant="outline" className="h-16 flex flex-col gap-1 border-primary/10 hover:bg-primary/5" asChild>
                     <Link to="/admin/customers">
                       <Users className="h-4 w-4 text-primary" />
                       <span className="text-[10px] uppercase tracking-widest">View Audience</span>
                     </Link>
                   </Button>
                   <Button variant="outline" className="h-16 flex flex-col gap-1 border-primary/10 hover:bg-primary/5" asChild>
                     <Link to="/admin/settings">
                       <Sparkles className="h-4 w-4 text-primary" />
                       <span className="text-[10px] uppercase tracking-widest">Settings</span>
                     </Link>
                   </Button>
                </CardContent>
              </Card>
            </div>

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
                    <div className="p-4 bg-background rounded-xl border">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-[10px] uppercase tracking-widest font-sans font-bold">Top Opportunity</span>
                      </div>
                      <p className="text-sm font-sans">Bundle 'Copacabana Set' with matching cover-up for +$45 AOV increase</p>
                    </div>
                    <div className="p-4 bg-background rounded-xl border">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] uppercase tracking-widest font-sans font-bold">Growth Signal</span>
                      </div>
                      <p className="text-sm font-sans">Instagram traffic up 34% - optimize product pages for mobile conversion</p>
                    </div>
                  </div>

                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* AI Chat */}
              <Card className="border-primary/20 bg-gradient-to-b from-background to-primary/5">
                <CardHeader className="pb-3 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="font-serif text-lg">AI Assistant</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-[400px]">
                  <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-thin">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="flex justify-center px-4">
                        <div className={`max-w-[90%] p-4 rounded-2xl text-sm font-sans text-center transition-all duration-300 ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-background border border-primary/10 shadow-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isAiTyping && (
                      <div className="flex justify-center">
                        <div className="bg-background border border-primary/10 p-3 rounded-full shadow-sm">
                          <div className="flex gap-1.5 px-2">
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex flex-col items-center gap-3 mt-auto">
                    <div className="flex w-full gap-2 bg-background border rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <input
                        type="text"
                        placeholder="Ask about store optimization..."
                        className="flex-1 bg-transparent border-none px-3 py-2 text-sm font-sans outline-none"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button size="icon" className="bg-primary hover:scale-105 transition-transform shrink-0" onClick={handleSendMessage}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">Powered by Nina Intelligence</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Most Viewed Products */}
            {mostViewed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Most Viewed Products</CardTitle>
                  <CardDescription>Based on customer browsing data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mostViewed.map((product) => (
                      <div key={product.id} className="text-center">
                        <img src={product.image} alt={product.title} className="w-full aspect-[3/4] object-cover rounded-lg mb-2" />
                        <p className="text-sm font-sans font-medium truncate">{product.title}</p>
                        <p className="text-xs text-muted-foreground">{product.views} views</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Weekly Sales</CardTitle>
                  <CardDescription>Revenue performance over the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Traffic Trends</CardTitle>
                  <CardDescription>Website visitor patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Line type="monotone" dataKey="traffic" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
