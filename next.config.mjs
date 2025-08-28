/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // Square CDN hosts
      { protocol: "https", hostname: "images.squarecdn.com" },
      { protocol: "https", hostname: "images-production.squarecdn.com" },
      // S3 buckets Square uses for catalog images (sandbox & prod, common regions)
      { protocol: "https", hostname: "square-catalog-sandbox.s3.amazonaws.com" },
      { protocol: "https", hostname: "square-catalog-production.s3.amazonaws.com" },
      { protocol: "https", hostname: "items-images-sandbox.s3.us-west-2.amazonaws.com" },
      { protocol: "https", hostname: "items-images-production.s3.us-west-2.amazonaws.com" },
      // Optional catch-alls for other regions (uncomment if needed)
      // { protocol: "https", hostname: "items-images-sandbox.s3.*.amazonaws.com" },
      // { protocol: "https", hostname: "items-images-production.s3.*.amazonaws.com" },
    ],
  },
};

export default nextConfig;
