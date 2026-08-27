/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/media/hero_hls/1080_only.m3u8",
        destination: "https://cdn.voskopulence.com/hero_hls/master.m3u8",
        permanent: false,
      },
      {
        source: "/media/:path*",
        destination: "https://cdn.voskopulence.com/:path*",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
