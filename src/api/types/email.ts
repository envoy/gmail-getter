export type Email = {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    partId: string
    mimeType: string
    filename: string
    headers: {
      name: string
      value: string
    }[]
    body: {
      size: number
      data: string
    }
    parts: {
      partId: string
      mimeType: string
      filename: string
      headers: {
        name: string
        value: string
      }[]
      body: {
        size: number
        data: string
      }
    }[]
  }
  sizeEstimate: number
  historyId: string
  internalDate: string
}
