/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Security Headers ─────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://maps.gstatic.com https://maps.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com",
              "frame-src 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ── Images ───────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Supabase project URL: fumjwepjkfoxpflibvih.supabase.co
        hostname: 'fumjwepjkfoxpflibvih.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  // ── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Untuk upload foto via web
    },
  },
};

module.exports = nextConfig;
