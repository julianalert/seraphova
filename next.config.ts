import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-XSS-Protection',          value: '1; mode=block' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  {
    key:   'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key:   'Content-Security-Policy',
    // Stripe Elements requires js.stripe.com and hooks.stripe.com
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://scripts.simpleanalyticscdn.com",
      "frame-src 'self' https://js.stripe.com",
      "connect-src 'self' https://api.stripe.com https://hooks.stripe.com https://queue.simpleanalyticscdn.com",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      // Apply to all routes
      source:  '/(.*)',
      headers: securityHeaders,
    },
  ],

  // Prevent exposing server internals in errors
  productionBrowserSourceMaps: false,

  // Disable the X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;
