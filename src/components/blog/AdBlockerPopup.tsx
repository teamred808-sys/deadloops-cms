import { useState, useEffect } from 'react';
import { useAdBlocker } from '@/hooks/useAdBlocker';
import { getSettings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Settings } from '@/types/blog';
import { 
  Chrome, 
  RefreshCw,
  Shield,
} from 'lucide-react';

export default function AdBlockerPopup() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  
  useEffect(() => {
    getSettings().then(setSettings);
  }, []);
  
  const { isBlocked, recheck, isChecking } = useAdBlocker(settings?.adBlockerDetectionEnabled ?? false);

  useEffect(() => {
    if (isBlocked && !dismissed) {
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, [isBlocked, dismissed]);

  // Recheck every 5 seconds if ad blocker is still active
  useEffect(() => {
    if (!showPopup || !isBlocked) return;

    const interval = setInterval(() => {
      recheck();
    }, 5000);

    return () => clearInterval(interval);
  }, [showPopup, isBlocked, recheck]);

  // Reset dismissed state after 5 seconds if still blocked
  useEffect(() => {
    if (dismissed && isBlocked) {
      const timeout = setTimeout(() => {
        setDismissed(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [dismissed, isBlocked]);

  const handleRecheck = async () => {
    await recheck();
    if (!isBlocked) {
      setShowPopup(false);
      setDismissed(false);
    }
  };

  if (!showPopup || !settings) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border shadow-2xl rounded-2xl max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 mb-4">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Ad Blocker Detected</h2>
          <p className="text-muted-foreground">
            {settings.adBlockerMessage}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Chrome className="h-5 w-5" />
              How to Disable Your Ad Blocker
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Click on the ad blocker icon in your browser toolbar</li>
              <li>Look for "Pause on this site" or "Don't run on this site" option</li>
              <li>Click to disable the ad blocker for this website</li>
              <li>Refresh the page or click the button below</li>
            </ol>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            <p>Common ad blockers: uBlock Origin, AdBlock, AdBlock Plus, Ghostery</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleRecheck}
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                I've Disabled It - Check Again
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            We use ads to keep our content free. Thank you for your support!
          </p>
        </div>
      </div>
    </div>
  );
}
