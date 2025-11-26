/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/zustand-lite-demo',
  assetPrefix: '/zustand-lite-demo/',
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ['zustand-lite'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
