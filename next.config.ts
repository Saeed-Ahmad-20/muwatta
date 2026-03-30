import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          // ==========================================
          // 🔒 SECURITY HEADERS
          // ==========================================

          // Prevents clickjacking — blocks your site from being embedded in iframes
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          // Stops browsers from MIME-sniffing the content type
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          // Controls how much referrer info is sent with requests
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },

          // Blocks access to browser features you don't need
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },

          // Forces HTTPS for 1 year (including subdomains)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },

          // Enables XSS filtering in older browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },

          // Prevents your site from being used as a cross-origin opener
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },

          // Controls what resources can be embedded cross-origin
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },

          // Content Security Policy — the most powerful header
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",  // Next.js requires these
              "style-src 'self' 'unsafe-inline'",                  // Tailwind injects inline styles
              "img-src 'self' data: blob: https:",                 // Allow images from HTTPS sources
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.tickettailor.com https://graph.facebook.com", // Your API connections
              "frame-src 'self' https://www.instagram.com",        // Instagram embeds (if using socials page)
              "frame-ancestors 'none'",                            // Same as X-Frame-Options DENY
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",                                 // Blocks Flash/Java plugins
              "upgrade-insecure-requests",                         // Auto-upgrades HTTP to HTTPS
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig