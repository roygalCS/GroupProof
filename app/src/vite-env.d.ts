/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string
  readonly VITE_PROGRAM_ID?: string
  readonly VITE_USDC_MINT?: string
  readonly VITE_SOLANA_RPC_URL?: string
  readonly VITE_WEB3_STORAGE_TOKEN?: string
  readonly VITE_DEV_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

