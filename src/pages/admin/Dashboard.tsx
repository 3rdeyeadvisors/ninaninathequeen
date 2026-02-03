
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, DollarSign, Package, LayoutDashboard, Settings, Brain, Sparkles, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-24 pb-12 container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-2">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-lg shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-sans font-medium">Dashboard</span>
            </Link>
            <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 hover:bg-card rounded-lg transition-colors">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="font-sans">Products</span>
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-card rounded-lg transition-colors">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              <span className="font-sans">Orders</span>
            </Link>
            <Link to="/admin/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-card rounded-lg transition-colors">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="font-sans">Settings</span>
            </Link>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-serif text-3xl">Store Overview</h1>
                <p className="text-muted-foreground text-sm">Welcome back, Lydia. Here's what's happening today.</p>
              </div>
              <div className="text-sm text-muted-foreground">Last updated: Just now</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-serif">$45,231.89</div>
                  <p className="text-xs text-emerald-500 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +20.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-serif">+2350</div>
                  <p className="text-xs text-emerald-500 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +180.1% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Customers</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-serif">+12,234</div>
                  <p className="text-xs text-emerald-500 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +19% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Inventory Status</CardTitle>
                  <Package className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-serif">842 Items</div>
                  <p className="text-xs text-amber-500 flex items-center mt-1">
                    12 items low in stock
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                       <div className="p-2 bg-primary/10 rounded-lg">
                          <Brain className="h-5 w-5 text-primary" />
                       </div>
                       <div>
                          <CardTitle className="font-serif text-xl">Personal AI Insights</CardTitle>
                          <CardDescription>AI-driven recommendations for your store</CardDescription>
                       </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-card border rounded-xl space-y-3">
                           <div className="flex items-center gap-2 text-primary">
                              <Sparkles className="h-4 w-4" />
                              <span className="text-xs font-sans tracking-widest uppercase font-bold">Trend Forecast</span>
                           </div>
                           <p className="text-sm leading-relaxed">
                              "Highwaisted silhouettes in <strong>Copacabana Gold</strong> are trending up by 35% among Gen Z shoppers in the Miami area."
                           </p>
                           <Button variant="link" className="p-0 h-auto text-xs text-primary">View trend data →</Button>
                        </div>
                        <div className="p-4 bg-card border rounded-xl space-y-3">
                           <div className="flex items-center gap-2 text-primary">
                              <Package className="h-4 w-4" />
                              <span className="text-xs font-sans tracking-widest uppercase font-bold">Inventory Alert</span>
                           </div>
                           <p className="text-sm leading-relaxed">
                              "Suggested restock for <strong>Leblon One-Piece (Medium)</strong>. At current sales velocity, you will be out of stock in 4 days."
                           </p>
                           <Button variant="link" className="p-0 h-auto text-xs text-primary">Optimize inventory →</Button>
                        </div>
                     </div>
                     <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-full mt-1">
                           <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                           <p className="text-sm font-medium">Customer Sentiment Analysis</p>
                           <p className="text-xs text-muted-foreground leading-relaxed">
                              Recent reviews mention the "buttery soft fabric" frequently. AI suggests highlighting this in your next email campaign to increase conversion by an estimated 12%.
                           </p>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Card className="flex flex-col">
                  <CardHeader>
                     <CardTitle className="font-serif text-xl">Quick Actions</CardTitle>
                     <CardDescription>Common tasks for today</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                     <Button className="w-full justify-start font-sans" variant="outline">
                        <ShoppingBag className="h-4 w-4 mr-2" /> Process 12 New Orders
                     </Button>
                     <Button className="w-full justify-start font-sans" variant="outline">
                        <Package className="h-4 w-4 mr-2" /> Restock Low Inventory
                     </Button>
                     <Button className="w-full justify-start font-sans" variant="outline">
                        <Users className="h-4 w-4 mr-2" /> Review Customer Inquiries
                     </Button>
                     <div className="pt-4 mt-4 border-t">
                        <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-4">AI Concierge</p>
                        <div className="relative">
                           <textarea
                             placeholder="Ask your AI assistant anything..."
                             className="w-full h-24 bg-secondary/30 rounded-lg p-3 text-xs border-none focus:ring-1 focus:ring-primary resize-none font-sans"
                           />
                           <Button size="sm" className="absolute bottom-2 right-2 h-7 text-[10px] px-3">Send</Button>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <CardHeader className="px-0 pt-0">
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
                <CardHeader className="px-0 pt-0">
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
