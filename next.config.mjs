/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'image.thum.io' },
    ],
  },
  serverExternalPackages: ['bcryptjs'],
  // Railway asigna el puerto dinámicamente via $PORT
  ...(process.env.PORT ? { env: { PORT: process.env.PORT } } : {}),
}

export default nextConfig
