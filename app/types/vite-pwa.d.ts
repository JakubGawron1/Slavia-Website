declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
  }

  export interface RegisterSWResult {
    needRefresh: boolean
    offlineReady: boolean
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }

  export function registerSW(options?: RegisterSWOptions): RegisterSWResult
  export default registerSW
}
