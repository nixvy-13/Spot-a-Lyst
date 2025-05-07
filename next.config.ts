/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co', 'platform-lookaside.fbsbx.com', 'img.clerk.com'],
    remotePatterns: [new URL('https://*.spotifycdn.com/**')],
  },
  serverExternalPackages: ['spotify-web-api-node'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
