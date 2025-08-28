/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // keep relaxed while we iterate
    ignoreDuringBuilds: true,
  },
  images: {
    // Square menu photos are served from these hosts
    remotePatterns: [
      { protocol: "https", hostname: "images.squarecdn.com" },
      { protocol: "https", hostname: "images-production.squarecdn.com" },
      { protocol: "https", hostname: "square-catalog-production.s3.amazonaws.com" },
      { protocol: "https", hostname: "square-catalog-sandbox.s3.amazonaws.com" },
    ],
  },
};

export default nextConfig;
