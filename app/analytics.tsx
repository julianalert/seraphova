import Script from 'next/script';

export default function Analytics() {
  return (
    <Script
      src="https://scripts.simpleanalyticscdn.com/latest.js"
      strategy="afterInteractive"
    />
  );
}
