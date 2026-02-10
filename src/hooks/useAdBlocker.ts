import { useState, useEffect, useCallback } from 'react';

export function useAdBlocker(enabled: boolean = true) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkAdBlocker = useCallback(async () => {
    if (!enabled) {
      setIsBlocked(false);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);

    // Method 1: Bait element technique
    const baitElement = document.createElement('div');
    baitElement.className = 'adsbox ad-banner ad-placement pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads banner-ad';
    baitElement.style.cssText = 'position: absolute; top: -10px; left: -10px; width: 1px; height: 1px; pointer-events: none;';
    baitElement.innerHTML = '&nbsp;';
    document.body.appendChild(baitElement);

    // Small delay to let ad blockers process
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if element was hidden/removed
    const baitStyles = window.getComputedStyle(baitElement);
    const isHiddenByBait = 
      baitElement.offsetParent === null ||
      baitStyles.display === 'none' ||
      baitStyles.visibility === 'hidden' ||
      baitElement.offsetHeight === 0;

    document.body.removeChild(baitElement);

    // Method 2: Try to fetch a fake ad script
    let isBlockedByFetch = false;
    try {
      // Create an element that looks like an ad
      const testAd = document.createElement('div');
      testAd.id = 'ad-test-element';
      testAd.className = 'adsbygoogle';
      testAd.style.cssText = 'width: 1px; height: 1px; position: absolute; left: -10000px;';
      document.body.appendChild(testAd);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const adStyles = window.getComputedStyle(testAd);
      isBlockedByFetch = adStyles.display === 'none' || adStyles.visibility === 'hidden';
      
      document.body.removeChild(testAd);
    } catch (e) {
      isBlockedByFetch = true;
    }

    setIsBlocked(isHiddenByBait || isBlockedByFetch);
    setIsChecking(false);
  }, [enabled]);

  useEffect(() => {
    // Defer ad blocker check to avoid blocking initial render (INP optimization)
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => checkAdBlocker());
    } else {
      setTimeout(checkAdBlocker, 200);
    }
  }, [checkAdBlocker]);

  return { isBlocked, isChecking, recheck: checkAdBlocker };
}
