
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdminStore } from '@/stores/adminStore';
import { useSettingsDb } from '@/hooks/useSettingsDb';
import { useState } from 'react';
import { toast } from 'sonner';
import { Store, Globe, Bell, Shield, Save, CreditCard, Key, ExternalLink, CheckCircle, Loader2, Search, Share2, Mail, Phone, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export default function AdminSettings() {
  const { settings, updateSettings } = useAdminStore();
  const { updateSettingsDb } = useSettingsDb();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mask the token for display
  const maskedToken = localSettings.squareApiKey 
    ? `${localSettings.squareApiKey.slice(0, 4)}...${localSettings.squareApiKey.slice(-4)}` 
    : '';

  const handleSave = async () => {
    setIsSaving(true);

    const savePromise = updateSettingsDb(localSettings);

    toast.promise(savePromise, {
      loading: 'Saving store settings...',
      success: (success) => {
        if (success) {
          updateSettings(localSettings);
          setIsEditingToken(false);
          return "Store settings saved!";
        }
        return "Failed to save settings to database.";
      },
      error: "An error occurred while saving."
    });

    try {
      await savePromise;
    } finally {
      setIsSaving(false);
    }
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
                      <CreditCard className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Payment Gateway (Square)</CardTitle>
                    </div>
                    <CardDescription>Configure your Square integration for payments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="squareAppId">Application ID</Label>
                      <Input
                        id="squareAppId"
                        value={localSettings.squareApplicationId}
                        onChange={(e) => setLocalSettings({...localSettings, squareApplicationId: e.target.value})}
                        placeholder="sq0idp-..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="squareLocId">Location ID</Label>
                      <Input
                        id="squareLocId"
                        value={localSettings.squareLocationId}
                        onChange={(e) => setLocalSettings({...localSettings, squareLocationId: e.target.value})}
                        placeholder="L..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="squareApiKey">API Key (Access Token)</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] uppercase tracking-widest text-muted-foreground"
                          onClick={() => setIsEditingToken(!isEditingToken)}
                        >
                          {isEditingToken ? 'Cancel' : 'Change'}
                        </Button>
                      </div>
                      {isEditingToken ? (
                        <Input
                          id="squareApiKey"
                          type="password"
                          value={localSettings.squareApiKey}
                          onChange={(e) => setLocalSettings({...localSettings, squareApiKey: e.target.value})}
                          placeholder="EAAA..."
                        />
                      ) : (
                        <Input
                          id="squareApiKey"
                          value={maskedToken}
                          disabled
                          className="bg-secondary/20"
                        />
                      )}
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

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">SEO & Search Discovery</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="seoTitle">Page Title Pattern</Label>
                      <Input
                        id="seoTitle"
                        value={localSettings.seoTitle}
                        onChange={(e) => setLocalSettings({...localSettings, seoTitle: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="seoDesc">Meta Description</Label>
                      <Textarea
                        id="seoDesc"
                        value={localSettings.seoDescription}
                        onChange={(e) => setLocalSettings({...localSettings, seoDescription: e.target.value})}
                        className="h-24 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Social Media Presence</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="instagram">Instagram URL</Label>
                      <Input
                        id="instagram"
                        value={localSettings.instagramUrl}
                        onChange={(e) => setLocalSettings({...localSettings, instagramUrl: e.target.value})}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="facebook">Facebook URL</Label>
                      <Input
                        id="facebook"
                        value={localSettings.facebookUrl}
                        onChange={(e) => setLocalSettings({...localSettings, facebookUrl: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tiktok">TikTok URL</Label>
                      <Input
                        id="tiktok"
                        value={localSettings.tiktokUrl}
                        onChange={(e) => setLocalSettings({...localSettings, tiktokUrl: e.target.value})}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      <CardTitle className="font-serif">Contact Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactEmail">Customer Support Email</Label>
                      <Input
                        id="contactEmail"
                        value={localSettings.contactEmail}
                        onChange={(e) => setLocalSettings({...localSettings, contactEmail: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactPhone">Business Phone</Label>
                      <Input
                        id="contactPhone"
                        value={localSettings.contactPhone}
                        onChange={(e) => setLocalSettings({...localSettings, contactPhone: e.target.value})}
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
                    <Button className="w-full bg-primary py-6" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      {isSaving ? 'Saving...' : 'Save Configuration'}
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
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                      <CardTitle className="font-serif">Store Status</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-amber-200">
                      <div className="space-y-0.5">
                        <Label className="text-amber-900">Maintenance Mode</Label>
                        <p className="text-[10px] text-amber-700">Display a "Coming Soon" page to visitors</p>
                      </div>
                      <Switch
                        checked={localSettings.isMaintenanceMode}
                        onCheckedChange={(checked) => setLocalSettings({...localSettings, isMaintenanceMode: checked})}
                      />
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
