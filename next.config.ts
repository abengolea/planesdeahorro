import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* Monorepo local: forzar trazado al root de esta app (evita lockfile del repo padre). */
  outputFileTracingRoot: path.join(__dirname),
  /* Evita empaquetar pdf.js en el bundle del servidor. */
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // PDFs subidos a server actions (extraer texto + IA).
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
};

export default nextConfig;
