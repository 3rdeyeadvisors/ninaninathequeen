
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdminStore } from '@/stores/adminStore';
import { useState } from 'react';
import { toast } from 'sonner';
import { Store, Globe, Bell, Shield, Save, CreditCard, Key, ExternalLink, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminSettings() {
  const { settings, updateSettings } = useAdminStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isEditingToken, setIsEditingToken] = useState(false);

  // Mask the token for display
  const maskedToken = localSettings.squareApiKey 
    ? `${localSettings.squareApiKey.slice(0, 4)}...${localSettings.squareApiKey.slice(-4)}` 
    : '';

  const handleSave = () => {
    updateSettings(localSettings);
    setIsEditingToken(false);
    toast.success("Store settings updated successfully!");
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-32 md:pt-40 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-4">
          <AdminSidebar />

          {/* Main Content */}
          <main className="w-full space-y-8 px-0 sm:px-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <h1 className="font-serif text-4xl tracking-tight">Store Settings</h1>
              <p className="text-muted-foreground text-sm max-w-md">Configure your store's global parameters and administrative preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">General Configuration</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        value={localSettings.storeName}
                        onChange={(e) => setLocalSettings({...localSettings, storeName: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                          id="currency"
                          value={localSettings.currency}
                          onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tax">Tax Rate (%)</Label>
                        <Input
                          id="tax"
                          type="number"
                          value={localSettings.taxRate}
                          onChange={(e) => setLocalSettings({...localSettings, taxRate: parseFloat(e.target.value)})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Regional & Shipping</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="space-y-0.5">
                        <Label>International Shipping</Label>
                        <p className="text-xs text-muted-foreground">Allow orders from outside Brazil</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Free Shipping Threshold</Label>
                        <p className="text-xs text-muted-foreground">Currently: 2+ Bikini Sets</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 shadow-gold">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Point of Sale Integration</CardTitle>
                    </div>
                    <CardDescription>Configure your in-person payment processing system</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 p-4 bg-secondary/20 rounded-xl border border-primary/10">
                      <div className="grid gap-2">
                        <Label>Payment Provider</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant={localSettings.posProvider === 'square' ? 'default' : 'outline'}
                            className="capitalize font-sans text-[10px] tracking-widest h-10"
                            onClick={() => setLocalSettings({...localSettings, posProvider: 'square'})}
                          >
                            Square
                          </Button>
                          <Button
                            variant={localSettings.posProvider === 'none' ? 'default' : 'outline'}
                            className="capitalize font-sans text-[10px] tracking-widest h-10"
                            onClick={() => setLocalSettings({...localSettings, posProvider: 'none'})}
                          >
                            None
                          </Button>
                        </div>
                      </div>

                      {localSettings.posProvider === 'square' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          {localSettings.squareApiKey && !isEditingToken ? (
                            <div className="grid gap-2">
                              <Label className="flex items-center gap-2">
                                <Key className="h-3 w-3" /> Square Access Token
                              </Label>
                              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-primary/10">
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Connected
                                </Badge>
                                <span className="font-mono text-xs text-muted-foreground">{maskedToken}</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="ml-auto font-sans text-[10px] uppercase tracking-widest"
                                  onClick={() => setIsEditingToken(true)}
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-2">
                              <Label htmlFor="squareKey" className="flex items-center gap-2">
                                <Key className="h-3 w-3" /> Square Access Token
                              </Label>
                              <Input
                                id="squareKey"
                                type="password"
                                placeholder="EAAA..."
                                value={localSettings.squareApiKey}
                                onChange={(e) => setLocalSettings({...localSettings, squareApiKey: e.target.value})}
                                className="font-mono text-xs"
                              />
                              <p className="text-[10px] text-muted-foreground">
                                Generate this in your Square Developer Dashboard.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {localSettings.posProvider === 'none' && (
                        <p className="text-xs text-center py-4 text-muted-foreground italic">
                          Select Square to enable automated sync between your physical store and online inventory.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Automated Inventory Sync</Label>
                        <p className="text-[10px] text-muted-foreground">Keep Shopify and POS stock levels synchronized in real-time</p>
                      </div>
                      <Switch
                        checked={localSettings.autoSync}
                        onCheckedChange={(checked) => setLocalSettings({...localSettings, autoSync: checked})}
                        disabled={localSettings.posProvider === 'none'}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Save Changes</CardTitle>
                    <CardDescription>Ensure your store configurations are persisted.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-primary py-6" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Notifications</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Order Alerts</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Low Stock Alerts</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">AI Insights</Label>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
