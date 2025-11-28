const parseOrigin = (value) => {
  if (!value) return null
  try {
    return new URL(value.trim()).origin
  } catch {
    return null
  }
}

const toWsOrigin = (origin) => {
  if (!origin) return null
  if (origin.startsWith('https://')) return origin.replace('https://', 'wss://')
  if (origin.startsWith('http://')) return origin.replace('http://', 'ws://')
  return origin
}

const apiOrigin = parseOrigin(process.env.NEXT_PUBLIC_BASE_URL)
const socketHttpOrigin = parseOrigin(process.env.NEXT_PUBLIC_SOCKET_URL)
const socketWsOrigin = toWsOrigin(socketHttpOrigin)

const buildDirective = (name, values) =>
  `${name} ${[...new Set(values.filter(Boolean))].join(' ')};`

const PAYPAL_SCRIPT_HOSTS = [
  'https://www.paypal.com',
  'https://www.sandbox.paypal.com',
]

const PAYPAL_MEDIA_HOSTS = [
  'https://www.paypalobjects.com',
  'https://www.paypal.com',
  'https://www.sandbox.paypal.com',
]

const ContentSecurityPolicy = [
  buildDirective('default-src', ["'self'", 'https:', 'http:', 'data:', 'blob:']),
  buildDirective('script-src', [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'https:',
    'http:',
    'data:',
    'blob:',
    ...PAYPAL_SCRIPT_HOSTS,
  ]),
  buildDirective('style-src', ["'self'", "'unsafe-inline'", 'https:', 'http:']),
  buildDirective('img-src', [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'http:',
    ...PAYPAL_MEDIA_HOSTS,
  ]),
  buildDirective('media-src', ["'self'", 'data:', 'blob:', 'https:', 'http:']),
  buildDirective('connect-src', [
    "'self'",
    'https:',
    'http:',
    'wss:',
    'ws:',
    apiOrigin,
    socketHttpOrigin,
    socketWsOrigin,
    ...PAYPAL_SCRIPT_HOSTS,
  ]),
  buildDirective('font-src', ["'self'", 'data:', 'https:']),
  buildDirective('frame-ancestors', ["'none'"]),
].join(' ')

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
