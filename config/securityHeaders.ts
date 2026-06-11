/** Nagłówki HTTP ograniczające XSS / clickjacking (wszystkie trasy). */
export const slaviaSecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
} as const

export function withSecurityHeaders(
  headers: Record<string, string>
): Record<string, string> {
  return { ...slaviaSecurityHeaders, ...headers }
}
