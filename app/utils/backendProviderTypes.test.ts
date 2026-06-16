import { describe, expect, it } from 'vitest'
import {
  backendProviderFromEnv,
  backendProviderLabel,
  isBackendProviderDeprecated,
  isBackendProviderId,
  normalizeBackendProvider
} from './backendProviderTypes'

describe('backendProviderTypes', () => {
  it('normalizes legacy leapcell to huggingface', () => {
    expect(normalizeBackendProvider('leapcell')).toBe('huggingface')
    expect(normalizeBackendProvider('LEAPCELL')).toBe('huggingface')
  })

  it('defaults unknown values to huggingface', () => {
    expect(normalizeBackendProvider(undefined)).toBe('huggingface')
    expect(normalizeBackendProvider('unknown')).toBe('huggingface')
  })

  it('recognizes active providers only', () => {
    expect(isBackendProviderId('huggingface')).toBe(true)
    expect(isBackendProviderId('render')).toBe(true)
    expect(isBackendProviderId('leapcell')).toBe(false)
  })

  it('marks render as deprecated', () => {
    expect(isBackendProviderDeprecated('render')).toBe(true)
    expect(isBackendProviderDeprecated('huggingface')).toBe(false)
    expect(backendProviderLabel('render')).toContain('deprecated')
  })

  it('uses huggingface on Vercel preview', () => {
    const prev = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = 'preview'
    expect(backendProviderFromEnv()).toBe('huggingface')
    process.env.VERCEL_ENV = prev
  })
})
