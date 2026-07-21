const isDev = process.env.NODE_ENV === 'development'

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
const chatbotApiOrigin = parseOrigin(process.env.NEXT_PUBLIC_API_BASE_URL)
const socketHttpOrigin = parseOrigin(process.env.NEXT_PUBLIC_SOCKET_URL)
const socketWsOrigin = toWsOrigin(socketHttpOrigin)

// PayPal JS SDK loads scripts, renders button iframes, and phones home to
// these hosts. Sandbox hosts only matter when a sandbox client-id is used,
// but allowing them is harmless in production.
const PAYPAL_HOSTS = [
  'https://www.paypal.com',
  'https://www.sandbox.paypal.com',
]

const PAYPAL_ASSET_HOSTS = [
  'https://www.paypalobjects.com',
  'https://www.sandbox.paypalobjects.com',
]

// Stripe Elements is embedded, not a hosted-checkout redirect: Stripe.js
// loads from js.stripe.com and renders the card fields in iframes from the
// same origin, hooks.stripe.com serves 3-D Secure challenges, and the SDK
// talks to api.stripe.com directly. No form-action entry — nothing is ever
// submitted cross-origin.
const STRIPE_JS = 'https://js.stripe.com'
const STRIPE_API = 'https://api.stripe.com'
const STRIPE_HOOKS = 'https://hooks.stripe.com'

// Video pitches and images upload straight from the browser to Cloudflare R2
// via presigned URLs. Cover the account endpoint (path-style) and both
// buckets' virtual-hosted endpoints.
const R2_UPLOAD_HOSTS = [
  'https://5449740b86c17b732f66aadf3497ca0e.r2.cloudflarestorage.com',
  'https://evpitch.5449740b86c17b732f66aadf3497ca0e.r2.cloudflarestorage.com',
  'https://evpitch-images.5449740b86c17b732f66aadf3497ca0e.r2.cloudflarestorage.com',
]

const buildDirective = (name, values) =>
  `${name} ${[...new Set(values.filter(Boolean))].join(' ')};`

const ContentSecurityPolicy = [
  buildDirective('default-src', ["'self'"]),

  // Named hosts only — no https:/data:/blob: schemes (UpGuard flags those).
  // 'unsafe-inline' stays until we move to a nonce-based CSP: the Next.js
  // runtime injects inline scripts for hydration.
  buildDirective('script-src', [
    "'self'",
    "'unsafe-inline'",
    isDev && "'unsafe-eval'", // React Refresh needs eval in dev only
    ...PAYPAL_HOSTS,
    ...PAYPAL_ASSET_HOSTS,
    STRIPE_JS,
  ]),

  buildDirective('style-src', ["'self'", "'unsafe-inline'"]),

  // User-uploaded avatars/blog covers are served from arbitrary https hosts
  // (API, presigned S3 URLs), so img-src stays scheme-wide.
  buildDirective('img-src', ["'self'", 'data:', 'blob:', 'https:']),

  // Pitch videos: hls.js plays via MSE blob URLs; Safari native HLS hits the
  // API stream endpoint directly.
  buildDirective('media-src', ["'self'", 'blob:', 'data:', apiOrigin]),

  buildDirective('connect-src', [
    "'self'",
    apiOrigin,
    chatbotApiOrigin,
    socketHttpOrigin,
    socketWsOrigin,
    'https://countriesnow.space', // country/city dropdown data
    ...R2_UPLOAD_HOSTS,
    ...PAYPAL_HOSTS,
    ...PAYPAL_ASSET_HOSTS,
    STRIPE_API,
    STRIPE_JS,
    isDev && 'ws:', // Next.js HMR websocket
  ]),

  buildDirective('font-src', ["'self'", 'data:']),
  buildDirective('worker-src', ["'self'", 'blob:']),
  buildDirective('frame-src', ["'self'", ...PAYPAL_HOSTS, STRIPE_JS, STRIPE_HOOKS]),
  buildDirective('object-src', ["'none'"]),
  buildDirective('base-uri', ["'self'"]),
  buildDirective('form-action', ["'self'", ...PAYPAL_HOSTS]),
  buildDirective('frame-ancestors', ["'none'"]),

  !isDev && 'upgrade-insecure-requests;',
]
  .filter(Boolean)
  .join(' ')

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
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
