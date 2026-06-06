/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.wikia.nocookie.net"
      },
      {
        protocol: "https",
        hostname: "static.wikia.com"
      },
      {
        protocol: "https",
        hostname: "vignette.wikia.nocookie.net"
      }
    ]
  }
};

module.exports = nextConfig;
