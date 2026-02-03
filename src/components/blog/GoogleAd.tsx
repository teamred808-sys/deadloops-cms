import { useEffect, useRef } from 'react';
import { LayoutGrid, ListOrdered, FileText, Grid3X3 } from 'lucide-react';

export type AdType = 'display' | 'in-feed' | 'in-article' | 'multiplex';

interface GoogleAdProps {
  enabled: boolean;
  clientId: string;
  slotId: string;
  customCode?: string;
  adType?: AdType;
  className?: string;
}

const adTypeConfig: Record<AdType, { format: string; label: string; icon: typeof LayoutGrid; size: string }> = {
  'display': {
    format: 'auto',
    label: 'Display Ad',
    icon: LayoutGrid,
    size: '300x250'
  },
  'in-feed': {
    format: 'fluid',
    label: 'In-Feed Ad',
    icon: ListOrdered,
    size: 'Responsive'
  },
  'in-article': {
    format: 'fluid',
    label: 'In-Article Ad',
    icon: FileText,
    size: 'Responsive'
  },
  'multiplex': {
    format: 'autorelaxed',
    label: 'Multiplex Ad',
    icon: Grid3X3,
    size: 'Grid'
  },
};

export default function GoogleAd({
  enabled,
  clientId,
  slotId,
  customCode = '',
  adType = 'display',
  className = '',
}: GoogleAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const config = adTypeConfig[adType];

  useEffect(() => {
    if (!enabled || isInitialized.current) return;

    // If custom code is provided, inject it
    if (customCode && adRef.current) {
      adRef.current.innerHTML = customCode;

      // Execute any scripts in the custom code
      const scripts = adRef.current.querySelectorAll('script');
      scripts.forEach((script) => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        script.parentNode?.replaceChild(newScript, script);
      });

      isInitialized.current = true;
      return;
    }

    // If client ID and slot ID are provided, use standard AdSense
    if (clientId && slotId) {
      // Initialize the ad
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        isInitialized.current = true;
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [enabled, clientId, slotId, customCode]);

  const Icon = config.icon;

  // Show placeholder if ads are not enabled or not configured
  if (!enabled || (!customCode && (!clientId || !slotId))) {
    return (
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center bg-muted/30 contain-layout ${className}`}
        style={{ minHeight: adType === 'display' ? '280px' : adType === 'multiplex' ? '240px' : '120px' }}
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
          <Icon className="h-4 w-4" />
          <span>{config.label}</span>
        </div>
        <div className={`bg-muted mx-auto flex items-center justify-center rounded ${adType === 'display' ? 'h-[250px] w-full max-w-[300px]' :
            adType === 'multiplex' ? 'h-[200px] w-full grid grid-cols-2 gap-2 p-4' :
              'h-[100px] w-full'
          }`}>
          {adType === 'multiplex' ? (
            <>
              <div className="bg-muted-foreground/10 rounded h-full w-full" />
              <div className="bg-muted-foreground/10 rounded h-full w-full" />
              <div className="bg-muted-foreground/10 rounded h-full w-full" />
              <div className="bg-muted-foreground/10 rounded h-full w-full" />
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Ad Space ({config.size})</span>
          )}
        </div>
      </div>
    );
  }

  // Render custom ad code
  if (customCode) {
    return (
      <div
        ref={adRef}
        className={`border-2 border-dashed rounded-lg p-6 text-center bg-muted/30 ${className}`}
      />
    );
  }

  // Render standard AdSense ad based on type
  return (
    <div className={`text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={config.format}
        data-full-width-responsive="true"
        {...(adType === 'in-article' && { 'data-ad-layout': 'in-article' })}
        {...(adType === 'multiplex' && { 'data-matched-content-ui-type': 'image_sidebyside', 'data-matched-content-rows-num': '3', 'data-matched-content-columns-num': '1' })}
      />
    </div>
  );
}