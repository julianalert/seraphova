'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function PageViewTracker() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Fire a pageview on every client-side navigation
    if (typeof window !== 'undefined' && (window as any).sa_pageview) {
      (window as any).sa_pageview(window.location.pathname);
    }
  }, [pathname, searchParams]);

  return null;
}

export default function Analytics() {
  return (
    <>
      <Script
        src="https://scripts.simpleanalyticscdn.com/latest.js"
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
