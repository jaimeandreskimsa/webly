/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'image.thum.io' },
    ],
  },
  serverExternalPackages: ['bcryptjs', 'pg', 'nodemailer'],
}

export default nextConfig
