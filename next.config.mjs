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
]

const PAYPAL_MEDIA_HOSTS = [
  'https://www.paypalobjects.com',
  'https://www.paypal.com',
]

const ContentSecurityPolicy = [
  // EASY FIX: removed `http:` from everywhere
  buildDirective('default-src', ["'self'", 'https:', 'data:', 'blob:']),

  // EASY FIX: removed `'unsafe-eval'` and removed `http:`
  buildDirective('script-src', [
    "'self'",
    "'unsafe-inline'", // keep for now (hard to remove safely)
    'https:',
    'data:',
    'blob:',
    ...PAYPAL_SCRIPT_HOSTS,
  ]),

  buildDirective('style-src', ["'self'", "'unsafe-inline'", 'https:']),

  buildDirective('img-src', [
    "'self'",
    'data:',
    'blob:',
    'https:',
    ...PAYPAL_MEDIA_HOSTS,
  ]),

  buildDirective('media-src', ["'self'", 'data:', 'blob:', 'https:']),

  // removed `http:` scheme allowance; keep ws/wss for sockets for now
  buildDirective('connect-src', [
    "'self'",
    'https:',
    'wss:',
    'ws:',
    apiOrigin,
    socketHttpOrigin,
    socketWsOrigin,
    ...PAYPAL_SCRIPT_HOSTS,
  ]),

  buildDirective('font-src', ["'self'", 'data:', 'https:']),
  buildDirective('frame-ancestors', ["'none'"]),

  // helps avoid mixed-content issues (good for scanners too)
  'upgrade-insecure-requests;',
  'block-all-mixed-content;',
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
