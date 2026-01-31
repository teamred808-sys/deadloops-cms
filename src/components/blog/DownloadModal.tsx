import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Loader2 } from 'lucide-react';
import GoogleAd from './GoogleAd';

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  downloadUrl: string;
  filename: string;
  timerDuration: number;
  onComplete: () => void;
  adSettings?: {
    enabled: boolean;
    clientId: string;
    slotId: string;
    customCode: string;
  };
}

export default function DownloadModal({ 
  open, 
  onClose, 
  downloadUrl, 
  filename,
  timerDuration,
  onComplete,
  adSettings,
}: DownloadModalProps) {
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeLeft(timerDuration);
      setIsReady(false);
    }
  }, [open, timerDuration]);

  useEffect(() => {
    if (!open || isReady) return;

    if (timeLeft <= 0) {
      setIsReady(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [open, timeLeft, isReady]);

  const handleDownload = () => {
    // Trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onComplete();
    onClose();
  };

  const progress = ((timerDuration - timeLeft) / timerDuration) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download File</DialogTitle>
          <DialogDescription>
            {isReady 
              ? 'Your download is ready!' 
              : 'Please wait while your download is being prepared...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Timer Section */}
          <div className="text-center">
            {!isReady ? (
              <>
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-primary"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-2xl font-bold">{timeLeft}</span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing your download...
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <Download className="h-8 w-8 text-green-500" />
                </div>
                <p className="font-medium">{filename}</p>
              </div>
            )}
          </div>

          {/* Ad Section */}
          <GoogleAd
            enabled={adSettings?.enabled ?? false}
            clientId={adSettings?.clientId ?? ''}
            slotId={adSettings?.slotId ?? ''}
            customCode={adSettings?.customCode ?? ''}
            adType="display"
          />

          {/* Download Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleDownload}
            disabled={!isReady}
          >
            {isReady ? (
              <>
                <Download className="mr-2 h-5 w-5" />
                Download Now
              </>
            ) : (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Please Wait ({timeLeft}s)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
