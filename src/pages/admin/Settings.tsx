
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function AdminSettings() {
  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-32 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">
          <AdminSidebar />

          <main className="flex-1 space-y-8">
            <h1 className="font-serif text-3xl">Settings</h1>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">General Settings</CardTitle>
                  <CardDescription>Manage your store's basic information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="storeName" className="text-xs uppercase tracking-widest font-sans">Store Name</Label>
                    <Input id="storeName" defaultValue="NINA ARMEND" className="font-sans" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-widest font-sans">Contact Email</Label>
                    <Input id="email" defaultValue="lydia@ninaarmend.co.site" className="font-sans" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">AI Preferences</CardTitle>
                  <CardDescription>Configure how the AI Concierge interacts with your store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-sans">Automatic Inventory Optimizations</Label>
                      <p className="text-xs text-muted-foreground">Allow AI to suggest restocks based on trends</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-sans">Smart Pricing</Label>
                      <p className="text-xs text-muted-foreground">Dynamic pricing based on competitor data</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-primary px-8 font-sans uppercase tracking-widest text-xs h-12">Save Changes</Button>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
