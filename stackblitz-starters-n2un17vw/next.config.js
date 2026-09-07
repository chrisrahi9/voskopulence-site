/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [256, 320, 384, 480],
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
