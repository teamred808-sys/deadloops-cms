import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  getSettings,
  updateSettings,
  exportAllData,
  importAllData,
  clearAllData,
  changePassword,
  changeEmail,
  getStorageUsage,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Settings } from '@/types/blog';
import {
  Save,
  Download,
  Upload,
  Trash2,
  Image as ImageIcon,
  X,
  Loader2,
  Database,
  Shield,
} from 'lucide-react';
import { getUploadUrl } from '@/lib/apiClient';

const defaultSettings: Settings = {
  siteTitle: 'Deadloops',
  tagline: 'Music Production Resources & Tutorials',
  logo: null,
  postsPerPage: 12,
  downloadTimerDuration: 15,
  adBlockerDetectionEnabled: false,
  adBlockerMessage: 'Please disable your ad blocker to access downloads.',
  googleAdsEnabled: false,
  googleAdsClientId: '',
  googleAdsDisplaySlotId: '',
  googleAdsInFeedSlotId: '',
  googleAdsInArticleSlotId: '',
  googleAdsMultiplexSlotId: '',
  googleAdsCode: '',
};

export default function SettingsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, limit: 10240, percentage: 0 });

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    Promise.all([getSettings(), getStorageUsage()]).then(([settingsData, usageData]) => {
      setSettings(settingsData);
      setStorageUsage(usageData);
      setLoading(false);
    });
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      toast({ title: 'Settings saved', description: 'Your settings have been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Logo must be less than 1MB', variant: 'destructive' });
      return;
    }

    try {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          const media = await import('@/lib/api').then(m => m.addMedia(file, img.width, img.height));
          setSettings(prev => ({ ...prev, logo: media.url }));
          toast({ title: 'Logo uploaded', description: 'Site logo updated.' });
        } catch (error) {
          console.error(error);
          toast({ title: 'Error', description: 'Failed to upload logo', variant: 'destructive' });
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      img.src = objectUrl;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process image', variant: 'destructive' });
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blog-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: 'Data has been exported successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export data', variant: 'destructive' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const success = await importAllData(reader.result as string);
      if (success) {
        const newSettings = await getSettings();
        setSettings(newSettings);
        toast({ title: 'Imported', description: 'Data has been imported successfully.' });
      } else {
        toast({ title: 'Error', description: 'Failed to import data. Invalid format.', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    await clearAllData();
    const newSettings = await getSettings();
    setSettings(newSettings);
    toast({ title: 'Cleared', description: 'All data has been cleared.' });
    setClearDialogOpen(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const success = await changePassword(currentPassword, newPassword);
      if (success) {
        toast({ title: 'Password changed', description: 'Your password has been updated.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast({ title: 'Error', description: 'Current password is incorrect', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      toast({ title: 'Error', description: 'Please fill in all email fields', variant: 'destructive' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({ title: 'Error', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }

    setIsChangingEmail(true);
    try {
      await changeEmail(newEmail, emailPassword);
      toast({ title: 'Email changed', description: 'Your email has been updated. Please log in again.' });
      setNewEmail('');
      setEmailPassword('');
      window.location.href = '/superuser';
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to change email', variant: 'destructive' });
    } finally {
      setIsChangingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your blog settings</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="download">Download</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
          <TabsTrigger value="adblocker">Ad Blocker</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Identity</CardTitle>
              <CardDescription>Configure your blog's basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteTitle">Site Title</Label>
                <Input
                  id="siteTitle"
                  value={settings.siteTitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.tagline}
                  onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                {settings.logo ? (
                  <div className="relative inline-block">
                    <img src={getUploadUrl(settings.logo)} alt="Logo" className="h-16 object-contain" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setSettings(prev => ({ ...prev, logo: null }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 w-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload logo (max 1MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reading Tab */}
        <TabsContent value="reading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reading Settings</CardTitle>
              <CardDescription>Configure how posts are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="postsPerPage">Posts per page</Label>
                <Input
                  id="postsPerPage"
                  type="number"
                  min="1"
                  max="50"
                  value={settings.postsPerPage}
                  onChange={(e) => setSettings(prev => ({ ...prev, postsPerPage: parseInt(e.target.value) || 10 }))}
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Download Tab */}
        <TabsContent value="download" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Download Timer</CardTitle>
              <CardDescription>Configure the download timer duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timerDuration">Timer duration (seconds)</Label>
                <Input
                  id="timerDuration"
                  type="number"
                  min="5"
                  max="60"
                  value={settings.downloadTimerDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, downloadTimerDuration: parseInt(e.target.value) || 15 }))}
                  className="w-24"
                />
                <p className="text-sm text-muted-foreground">
                  Users must wait this long before downloading files
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ads Tab */}
        <TabsContent value="ads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Ads Configuration</CardTitle>
              <CardDescription>
                Configure Google AdSense to display ads on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="googleAdsEnabled">Enable Google Ads</Label>
                  <p className="text-sm text-muted-foreground">
                    Display ads on your website
                  </p>
                </div>
                <Switch
                  id="googleAdsEnabled"
                  checked={settings.googleAdsEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, googleAdsEnabled: checked }))}
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="googleAdsClientId">AdSense Publisher ID</Label>
                <Input
                  id="googleAdsClientId"
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  value={settings.googleAdsClientId}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleAdsClientId: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleAdsDisplaySlotId">Display Ad Slot ID</Label>
                <Input
                  id="googleAdsDisplaySlotId"
                  placeholder="1234567890"
                  value={settings.googleAdsDisplaySlotId}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleAdsDisplaySlotId: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">Used in download modal</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleAdsInFeedSlotId">In-Feed Ad Slot ID</Label>
                <Input
                  id="googleAdsInFeedSlotId"
                  placeholder="1234567890"
                  value={settings.googleAdsInFeedSlotId}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleAdsInFeedSlotId: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">Displayed between posts on homepage (after every 4 posts)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleAdsInArticleSlotId">In-Article Ad Slot ID</Label>
                <Input
                  id="googleAdsInArticleSlotId"
                  placeholder="1234567890"
                  value={settings.googleAdsInArticleSlotId}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleAdsInArticleSlotId: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">Displayed within blog post content</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleAdsMultiplexSlotId">Multiplex Ad Slot ID</Label>
                <Input
                  id="googleAdsMultiplexSlotId"
                  placeholder="1234567890"
                  value={settings.googleAdsMultiplexSlotId}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleAdsMultiplexSlotId: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">Displayed after related posts section</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleAdsCode">Custom Ad Code (Optional)</Label>
                <Textarea
                  id="googleAdsCode"
                  placeholder="<script>...</script>"
                  value={settings.googleAdsCode}
                  onChange={(e) => setSettings(prev => ({ ...prev, googleAdsCode: e.target.value }))}
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">Optional custom ad script for advanced configuration</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ad Blocker Tab */}
        <TabsContent value="adblocker" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ad Blocker Detection</CardTitle>
              <CardDescription>Configure ad blocker detection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Detection</Label>
                  <p className="text-sm text-muted-foreground">Show popup when ad blocker is detected</p>
                </div>
                <Switch
                  checked={settings.adBlockerDetectionEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, adBlockerDetectionEnabled: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={settings.adBlockerMessage}
                  onChange={(e) => setSettings(prev => ({ ...prev, adBlockerMessage: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
              <CardDescription>Monitor your storage usage (10GB limit)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{storageUsage.used.toFixed(2)} MB used</span>
                  <span>{storageUsage.limit} MB total</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export & Import</CardTitle>
              <CardDescription>Backup or restore your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <label>
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Import Data
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImport}
                      />
                    </span>
                  </Button>
                </label>
              </div>
              <Button variant="destructive" onClick={() => setClearDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Email</CardTitle>
              <CardDescription>Update your admin email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>New Email</Label>
                <Input
                  type="email"
                  placeholder="new@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangeEmail} disabled={isChangingEmail}>
                {isChangingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Email
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your admin password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all posts, categories, tags, and media. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
