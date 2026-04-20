import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Evita empaquetar pdf.js en el bundle del servidor. */
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
