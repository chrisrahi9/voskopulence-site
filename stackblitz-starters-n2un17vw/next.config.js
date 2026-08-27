/** @type {import('next').NextConfig} */
const nextConfig = {
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
