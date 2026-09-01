/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOSANA_CLIENT_ID?: string;
  readonly VITE_NOSANA_NETWORK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
