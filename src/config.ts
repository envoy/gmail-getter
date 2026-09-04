export interface GmailConfig {
  apiBaseUrl?: string
  tokenUrl?: string
  accessToken?: string
}

let defaults: Readonly<GmailConfig> = {}

/** Configure this process (e.g. an isolated test worker); return a teardown reset. */
export function configureGmail(config: GmailConfig): () => void {
  const previous = defaults
  defaults = Object.freeze({...config})
  return () => {
    defaults = previous
  }
}

export function currentGmailConfig(): Readonly<GmailConfig> {
  return defaults
}
