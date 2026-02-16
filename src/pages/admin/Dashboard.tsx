import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { TrendingUp, ShoppingBag, Users, DollarSign, Package, Brain, Sparkles, MessageSquare, Loader2, BarChart3, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useAdminStore } from '@/stores/adminStore';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

const VALID_STATUSES = ['Processing', 'Shipped', 'Delivered'];

export default function AdminDashboard() {
  const { data: allProducts } = useProducts(200);
  const { orders, customers, settings, productOverrides, _hasHydrated } = useAdminStore();
  
  const GREETING = "Hello! How can I help you optimize your store today?";
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: GREETING }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const [mostViewed, setMostViewed] = useState<{id: string, title: string, views: number, image: string}[]>([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [behavioralInsights, setBehavioralInsights] = useState<{userName: string, userEmail: string, productTitle: string, viewCount: number}[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    supabase.from('waitlist').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setWaitlistCount(count || 0);
    });
  }, []);

  // Fetch behavioral intelligence — browse-but-don't-buy detection
  useEffect(() => {
    const fetchBehavioral = async () => {
      try {
        const { data: views } = await supabase.from('product_views' as any).select('*');
        if (!views || views.length === 0) return;

        // Find high-intent browsers (3+ views in last 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const highIntent = (views as any[]).filter((v: any) => 
          v.view_count >= 3 && new Date(v.last_viewed_at) >= fourteenDaysAgo
        );

        if (highIntent.length === 0) return;

        // Get user profiles for these viewers
        const userIds = [...new Set(highIntent.map((v: any) => v.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('id, name, email').in('id', userIds);

        // Cross-reference with orders to see if they purchased
        const insights: {userName: string, userEmail: string, productTitle: string, viewCount: number}[] = [];
        
        for (const view of highIntent) {
          const profile = profiles?.find((p: any) => p.id === view.user_id);
          if (!profile) continue;

          // Check if this user purchased this product
          const userOrders = orders.filter(o => 
            o.customerEmail?.toLowerCase() === profile.email?.toLowerCase()
          );
          const purchased = userOrders.some(o => 
            (o.items || []).some((item: any) => 
              (item.title || item.name || '').toLowerCase().includes((view.product_title || '').toLowerCase())
            )
          );

          if (!purchased) {
            insights.push({
              userName: profile.name || profile.email?.split('@')[0] || 'Unknown',
              userEmail: profile.email,
              productTitle: view.product_title || 'Unknown Product',
              viewCount: view.view_count,
            });
          }
        }

        setBehavioralInsights(insights.slice(0, 5));
      } catch (err) {
        console.error('Behavioral fetch error:', err);
      }
    };
    fetchBehavioral();
  }, [orders]);



  useEffect(() => {
    const views = JSON.parse(localStorage.getItem('product_views') || '{}');
    const productInfo = JSON.parse(localStorage.getItem('tracked_products') || '{}');

    const sorted = Object.entries(views)
      .map(([id, count]) => {
        const info = productInfo[id];
        let title = info?.title;
        let image = info?.image;

        if (!title || !image) {
          const product = allProducts?.find(p => p.id === id);
          if (product) {
            title = title || product.title;
            image = image || product.images[0]?.url;
          }
        }

        return {
          id,
          views: count as number,
          title: title || 'Unknown Product',
          image: image || 'https://images.unsplash.com/photo-1585924756944-b82af627eca9?q=80&w=200'
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 4);

    setMostViewed(sorted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter orders to only confirmed ones (exclude Pending and Cancelled)
  const confirmedOrders = useMemo(() => {
    return orders.filter(o => VALID_STATUSES.includes(o.status));
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return confirmedOrders.reduce((acc, order) => acc + parseFloat(order.total), 0);
  }, [confirmedOrders]);

  const totalNetProfit = useMemo(() => {
    return confirmedOrders.reduce((acc, order) => {
      const revenue = parseFloat(order.total);
      const shipping = parseFloat(order.shippingCost || '0');
      
      // Auto-calculate COGS from unit costs if available
      let cost = 0;
      const manualItemCost = parseFloat(order.itemCost || '0');
      
      if (manualItemCost > 0) {
        // Use manual item cost if set
        cost = manualItemCost;
      } else {
        // Calculate from product unit costs
        cost = order.items.reduce((itemAcc, item) => {
          // Find matching product by title
          const matchingProduct = Object.values(productOverrides).find(
            p => p.title === item.title
          );
          const unitCost = parseFloat(matchingProduct?.unitCost || '0');
          return itemAcc + (unitCost * item.quantity);
        }, 0);
      }
      
      return acc + (revenue - shipping - cost);
    }, 0);
  }, [confirmedOrders, productOverrides]);

  // Real inventory stats from product overrides
  const totalInventory = useMemo(() => {
    return Object.values(productOverrides).reduce((acc, p) => {
      if (p.isDeleted) return acc;
      return acc + (p.inventory || 0);
    }, 0);
  }, [productOverrides]);

  const lowStockCount = useMemo(() => {
    const threshold = settings.lowStockThreshold || 10;
    return Object.values(productOverrides).filter(p => {
      if (p.isDeleted) return false;
      return p.inventory > 0 && p.inventory <= threshold;
    }).length;
  }, [productOverrides, settings.lowStockThreshold]);

  // Real chart data - group confirmed orders by day (last 7 days)
  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesByDay: Record<string, number> = {};
    days.forEach(d => salesByDay[d] = 0);

    confirmedOrders.forEach(order => {
      try {
        const date = new Date(order.date);
        const dayName = days[date.getDay()];
        salesByDay[dayName] += parseFloat(order.total);
      } catch { /* skip invalid dates */ }
    });

    return days.map(name => ({ name, sales: Math.round(salesByDay[name] * 100) / 100 }));
  }, [confirmedOrders]);

  // Dynamic insights from real data
  const insights = useMemo(() => {
    const topOpportunity = (() => {
      if (behavioralInsights.length > 0) {
        const top = behavioralInsights[0];
        return `${top.userName} viewed "${top.productTitle}" ${top.viewCount}x but hasn't purchased — consider reaching out with a personalized offer.`;
      }
      if (lowStockCount > 0) {
        return `${lowStockCount} product${lowStockCount > 1 ? 's are' : ' is'} running low on stock. Consider restocking soon to avoid missed sales.`;
      }
      if (confirmedOrders.length > 0) {
        return `You have ${confirmedOrders.length} confirmed order${confirmedOrders.length > 1 ? 's' : ''}. Keep the momentum going with targeted promotions.`;
      }
      const activeProducts = Object.values(productOverrides).filter(p => !p.isDeleted);
      const productCount = activeProducts.length;
      if (productCount > 0) {
        const waitlistNote = waitlistCount > 0 ? ` With ${waitlistCount} ${waitlistCount === 1 ? 'person' : 'people'} on your waitlist, consider launching with an exclusive early-access offer to convert them into first customers.` : ' Share your store link and social media to attract your first customers.';
        return `You have ${totalInventory.toLocaleString()} items across ${productCount} product${productCount > 1 ? 's' : ''} ready to sell.${waitlistNote}`;
      }
      return 'Add products and start promoting your store to drive your first sales.';
    })();

    const growthSignal = (() => {
      if (behavioralInsights.length > 1) {
        return `${behavioralInsights.length} users are browsing products repeatedly without purchasing. These are high-intent leads ready for conversion.`;
      }
      const pendingCount = orders.filter(o => o.status === 'Pending').length;
      if (pendingCount > 0) {
        return `${pendingCount} pending order${pendingCount > 1 ? 's' : ''} awaiting payment confirmation. These will auto-clear if abandoned.`;
      }
      if (customers.length > 0) {
        return `${customers.length} customer${customers.length > 1 ? 's' : ''} in your audience. Engage them with email campaigns or new arrivals.`;
      }
      if (waitlistCount > 0) {
        const igHandle = settings.instagramUrl ? ` Share your Instagram (${settings.instagramUrl}) and` : ' Share your';
        return `Your waitlist has ${waitlistCount} signup${waitlistCount > 1 ? 's' : ''}.${igHandle} waitlist link to grow your audience before launch.`;
      }
      return 'Build your customer base by sharing your store on social media.';
    })();

    return { topOpportunity, growthSignal };
  }, [confirmedOrders, orders, customers, lowStockCount, behavioralInsights, productOverrides, totalInventory, waitlistCount, settings]);

  // Build store context for AI chat — comprehensive brand + store intelligence
  const storeContext = useMemo(() => {
    const activeProducts = Object.values(productOverrides).filter(p => !p.isDeleted);
    const pendingOrders = orders.filter(o => o.status === 'Pending');
    const isMaintenanceMode = settings.isMaintenanceMode ?? false;

    const productCatalog = activeProducts
      .map(p => `- ${p.title} | $${p.price} | ${p.category || 'Uncategorized'} | ${p.inventory} in stock | Unit Cost: $${p.unitCost || '0.00'}${p.description ? ` | ${p.description.slice(0, 80)}` : ''}`)
      .join('\n');

    // === SALES ANALYTICS: aggregate order items to find best sellers ===
    const salesByProduct: Record<string, { units: number; revenue: number; buyers: string[] }> = {};
    const customerSpend: Record<string, { total: number; orders: number; email: string }> = {};
    const revenueByCategory: Record<string, number> = {};

    confirmedOrders.forEach(order => {
      const custName = order.customerName || 'Unknown';
      if (!customerSpend[custName]) customerSpend[custName] = { total: 0, orders: 0, email: order.customerEmail || '' };
      customerSpend[custName].total += parseFloat(order.total);
      customerSpend[custName].orders += 1;

      (order.items || []).forEach((item: any) => {
        const title = item.title || item.name || 'Unknown';
        if (!salesByProduct[title]) salesByProduct[title] = { units: 0, revenue: 0, buyers: [] };
        salesByProduct[title].units += item.quantity || 1;
        salesByProduct[title].revenue += (parseFloat(item.price || '0') * (item.quantity || 1));
        if (!salesByProduct[title].buyers.includes(custName)) salesByProduct[title].buyers.push(custName);

        // Revenue by category
        const product = activeProducts.find(p => p.title === title);
        const cat = product?.category || 'Other';
        revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (parseFloat(item.price || '0') * (item.quantity || 1));
      });
    });

    const topProducts = Object.entries(salesByProduct)
      .sort((a, b) => b[1].units - a[1].units)
      .slice(0, 10)
      .map(([title, d], i) => `${i + 1}. ${title} — ${d.units} units sold — $${d.revenue.toFixed(2)} revenue — Bought by: ${d.buyers.join(', ')}`)
      .join('\n');

    const topCustomers = Object.entries(customerSpend)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([name, d], i) => `${i + 1}. ${name} (${d.email}) — $${d.total.toFixed(2)} total — ${d.orders} order${d.orders > 1 ? 's' : ''}`)
      .join('\n');

    const avgOrderValue = confirmedOrders.length > 0
      ? (totalRevenue / confirmedOrders.length).toFixed(2)
      : '0.00';

    const categoryBreakdown = Object.entries(revenueByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, rev]) => `${cat}: $${rev.toFixed(2)}`)
      .join(' | ');

    const detailedOrderLog = confirmedOrders.slice(0, 20).map(o => {
      const itemList = (o.items || []).map((item: any) => {
        const size = item.size ? ` (${item.size})` : '';
        return `${item.title || item.name}${size} x${item.quantity || 1}`;
      }).join(', ');
      return `- Order #${o.id.slice(0, 8)}: ${o.customerName} — ${itemList} — $${o.total} (${o.status})`;
    }).join('\n');

    return `
=== BRAND IDENTITY ===
Brand: Nina Armend — Luxury Brazilian Swimwear
Mission: Celebrating body beauty with pride, grace, and individuality. The human body is not meant to be hidden, but to be shown with grace.
Target Audience: Fashion-forward women aged 25-40 who value body confidence, luxury, and sustainability.
Brand Values: Body positivity, Brazilian craftsmanship, eco-conscious fabrics, individuality, empowerment.
Key Differentiators: Premium Brazilian fabrics, handcrafted in Brazil, designed to flatter all body types, luxury positioning.
Founder: Lydia — Brazilian-born designer passionate about celebrating feminine beauty through swimwear.

=== BUSINESS STAGE ===
Stage: ${isMaintenanceMode ? 'Pre-launch (maintenance mode active, collecting waitlist signups)' : 'Live (store is open to the public)'}
Waitlist Signups: ${waitlistCount}
${isMaintenanceMode ? 'Strategy: Building anticipation and audience before official launch. Waitlist is the primary growth channel.' : ''}

=== STORE METRICS ===
Revenue: $${totalRevenue.toFixed(2)}
Net Profit: $${totalNetProfit.toFixed(2)}
Confirmed Orders: ${confirmedOrders.length}
Pending Orders: ${orders.filter(o => o.status === 'Pending').length}
Total Customers: ${customers.length}
Total Audience (Customers + Waitlist): ${customers.length + waitlistCount}
Total Inventory: ${totalInventory} items
Low Stock Products: ${lowStockCount} (threshold: ${settings.lowStockThreshold || 10})
Average Order Value: $${avgOrderValue}

=== PRODUCT CATALOG ===
${productCatalog || 'No active products yet.'}

=== SALES ANALYTICS ===
Most Sold Products (by units):
${topProducts || 'No sales data yet.'}

Revenue by Category: ${categoryBreakdown || 'No category data yet.'}

Top Customers by Spend:
${topCustomers || 'No customer data yet.'}

=== DETAILED ORDER LOG ===
${detailedOrderLog || 'No orders yet.'}

=== BEHAVIORAL INTELLIGENCE ===
${behavioralInsights.length > 0 
  ? 'Browse-But-Don\'t-Buy Patterns (users who viewed 3+ times without purchasing):\n' + 
    behavioralInsights.map((b, i) => `${i + 1}. ${b.userName} (${b.userEmail}) viewed "${b.productTitle}" ${b.viewCount} times — has NOT purchased`).join('\n')
  : 'No high-intent browsing patterns detected yet.'}
    `.trim();
  }, [totalRevenue, totalNetProfit, confirmedOrders, orders, productOverrides, totalInventory, lowStockCount, customers, settings, waitlistCount, behavioralInsights]);

  // Show loading skeleton while data is being restored from storage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-secondary/20">
        <Header />
        <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-8 lg:gap-12">
            <AdminSidebar />
            <main className="flex-1 space-y-8">
              <div className="flex flex-col items-center text-center space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-64" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-48 rounded-lg" />
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiTyping) return;

    const userMessage = chatInput;
    const userMsg = { role: 'user' as const, content: userMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    let assistantSoFar = '';
    let addedAssistant = false;

    // Fetch session ONCE at the top to avoid repeated auth calls that cause hangs
    let token: string | undefined;
    let userId: string | undefined;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
      userId = session?.user?.id;
    } catch (e) {
      console.error('Failed to get session:', e);
    }

    // Save user message to DB (fire-and-forget)
    if (userId) {
      supabase.from('chat_messages').insert({ user_id: userId, role: 'user', content: userMessage }).select('id').maybeSingle().then(() => {});
    }
    
    try {
      // Send full history (excluding greeting) for context
      const historyForAI = chatMessages
        .filter(m => m.content !== GREETING)
        .concat(userMsg)
        .map(m => ({ role: m.role, content: m.content }));

      const SUPABASE_URL = 'https://ykhgqjownxmioexytfzc.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraGdxam93bnhtaW9leHl0ZnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njc0MTksImV4cCI6MjA4NjE0MzQxOX0.fTKjyR0Sb6VYPyW4YfwWQYWNWS_CsxUlS8qhg61i2q4';
      
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: historyForAI,
          storeContext,
          mode: 'chat',
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: 'AI service error' }));
        throw new Error(errData.error || 'AI service error');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              if (!addedAssistant) {
                addedAssistant = true;
                setIsAiTyping(false); // Kill typing indicator on first token
                setChatMessages(prev => [...prev, { role: 'assistant' as const, content: assistantSoFar }]);
              } else {
                setChatMessages(prev =>
                  prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m)
                );
              }
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) {
        // Save assistant response to DB (fire-and-forget)
        if (userId) {
          supabase.from('chat_messages').insert({ user_id: userId, role: 'assistant', content: assistantSoFar }).select('id').maybeSingle().then(() => {});
        }
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: "I couldn't generate a response. Please try again." }]);
      }
    } catch (e: any) {
      console.error('AI chat error:', e);
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${e.message}` }]);
      if (e.message?.includes('Rate limit')) {
        toast.error('AI rate limit reached. Please wait a moment.');
      }
    } finally {
      setIsAiTyping(false);
    }
  };


  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-32 md:pt-40 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
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
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      {confirmedOrders.length} confirmed order{confirmedOrders.length !== 1 ? 's' : ''}
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
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      After costs & shipping
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
                    <div className="text-2xl font-serif mb-1">{confirmedOrders.length}</div>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      {orders.filter(o => o.status === 'Pending').length} pending
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
                    <div className="text-2xl font-serif mb-1">{customers.length + waitlistCount}</div>
                    <p className="text-[10px] text-muted-foreground flex items-center mt-1">
                      Total audience
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
                    <div className="text-3xl font-serif mb-1">{totalInventory.toLocaleString()} Items</div>
                    <p className={`text-xs flex items-center mt-1 ${lowStockCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {lowStockCount > 0 ? `${lowStockCount} item${lowStockCount > 1 ? 's' : ''} low in stock` : 'Stock levels healthy'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
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

              {/* Recent Orders Summary */}
              <Card className="border-primary/10 bg-background h-full overflow-hidden">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="font-serif text-lg">Recent Orders</CardTitle>
                  <Button variant="ghost" size="sm" className="text-[10px] uppercase tracking-widest" asChild>
                    <Link to="/admin/orders">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="space-y-4">
                    {orders.length > 0 ? (
                      orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between text-sm">
                          <div className="flex flex-col">
                            <span className="font-sans font-medium">{order.customerName}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{order.id} • {order.date}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-serif">${parseFloat(order.total).toFixed(2)}</span>
                            <Badge variant="outline" className="text-[8px] h-4 uppercase px-1">{order.status}</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm font-sans italic">
                        No recent orders found
                      </div>
                    )}
                  </div>
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
                        <CardDescription>Real-time insights from your store data</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Live Data
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
                      <p className="text-sm font-sans">{insights.topOpportunity}</p>
                    </div>
                    <div className="p-4 bg-background rounded-xl border">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] uppercase tracking-widest font-sans font-bold">Growth Signal</span>
                      </div>
                      <p className="text-sm font-sans">{insights.growthSignal}</p>
                    </div>
                  </div>

                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
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
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-thin">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="flex justify-center px-4">
                        <div className={`max-w-[90%] p-4 rounded-2xl text-sm font-sans transition-all duration-300 ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground shadow-md text-center'
                            : 'bg-background border border-primary/10 shadow-sm text-left'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : msg.content}
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
                  </div>
                  <div className="flex flex-col items-center gap-3 mt-auto">
                    <div className="flex w-full gap-2 bg-background border rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <input
                        type="text"
                        placeholder="Ask about your store data..."
                        className="flex-1 bg-transparent border-none px-3 py-2 text-sm font-sans outline-none"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isAiTyping}
                      />
                      <Button size="icon" className="bg-primary hover:scale-105 transition-transform shrink-0" onClick={handleSendMessage} disabled={isAiTyping}>
                        {isAiTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">Powered by Nina Intelligence</p>
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
                  <CardTitle className="font-serif">Sales by Day</CardTitle>
                  <CardDescription>Revenue from confirmed orders by day of week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
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
                  <CardTitle className="font-serif">Order Summary</CardTitle>
                  <CardDescription>Quick overview of order statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 py-4">
                    {['Processing', 'Shipped', 'Delivered', 'Pending', 'Cancelled'].map(status => {
                      const count = orders.filter(o => o.status === status).length;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              status === 'Delivered' ? 'bg-emerald-500' :
                              status === 'Processing' ? 'bg-blue-500' :
                              status === 'Shipped' ? 'bg-purple-500' :
                              status === 'Pending' ? 'bg-amber-500' :
                              'bg-red-500'
                            }`} />
                            <span className="text-sm font-sans">{status}</span>
                          </div>
                          <span className="font-serif text-lg">{count}</span>
                        </div>
                      );
                    })}
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
