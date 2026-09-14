/** @type {import('next').NextConfig} */

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://vosko-cdn.b-cdn.net https://cdn.voskopulence.com",
  "media-src 'self' blob: https://vosko-cdn.b-cdn.net https://cdn.voskopulence.com",
  "connect-src 'self' https://vosko-cdn.b-cdn.net https://cdn.voskopulence.com https://script.google.com https://script.googleusercontent.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
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
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'Origin-Agent-Cluster',
    value: '?1',
  },
];

const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [256, 320, 384, 480],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/media/hero_hls/1080_only.m3u8",
        destination: "https://vosko-cdn.b-cdn.net/hero_hls/1080p/playlist.m3u8",
        permanent: false,
      },
      {
        source: "/media/:path*",
        destination: "https://vosko-cdn.b-cdn.net/:path*",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
