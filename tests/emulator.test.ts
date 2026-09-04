import {createServer, Server} from 'node:http'
import {AddressInfo} from 'node:net'
import axios from 'axios'
import {checkInbox, getAccessToken} from '../src'
import * as gmail from '../src'

describe('configurable emulator endpoints', () => {
  let server: Server
  let base: string
  let searches: number
  const query = 'to:guest+tag@example.com subject:Hello & welcome'

  beforeEach(async () => {
    searches = 0
    server = createServer(async (req, res) => {
      res.setHeader('content-type', 'application/json')
      if (req.url === '/token') {
        let body = ''
        for await (const chunk of req) body += chunk
        expect(new URLSearchParams(body).get('grant_type')).toBe('refresh_token')
        res.end(JSON.stringify({access_token: 'local-token'}))
        return
      }

      if (req.headers.authorization !== 'Bearer local-token') {
        res.writeHead(401).end(JSON.stringify({error: 'secret-must-not-leak'}))
        return
      }

      const url = new URL(req.url!, base)
      if (url.pathname === '/inbox/gmail/v1/users/me/messages') {
        expect(url.searchParams.get('q')).toBe(query)
        searches++
        res.end(
          JSON.stringify(
            searches === 1 ? {} : searches === 2 ? {messages: []} : {messages: [{id: 'message-1'}]}
          )
        )
      } else if (url.pathname === '/inbox/gmail/v1/users/me/messages/message-1') {
        res.end(
          JSON.stringify({
            id: 'message-1',
            payload: {mimeType: 'text/html', body: {data: 'PGI+aGk8L2I+'}},
          })
        )
      } else res.writeHead(404).end('{}')
    })

    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    // A missing endpoint override must fail locally, never contact real Google.
    const request = axios.request.bind(axios)

    jest.spyOn(axios, 'request').mockImplementation(config => {
      if (!config.url?.startsWith(base + '/')) throw new Error('Unexpected non-local request')
      return request(config)
    })
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await new Promise<void>(resolve => server.close(() => resolve()))
  })

  test('refreshes a token through the configured OAuth endpoint', async () => {
    const token = await getAccessToken('client', 'secret', 'refresh', {tokenUrl: `${base}/token`})
    expect(token).toBe('local-token')
  })

  test('scopes endpoint and test token without changing existing client calls', async () => {
    const reset = gmail.configureGmail({apiBaseUrl: `${base}/inbox/`, accessToken: 'local-token'})

    try {
      const token = await getAccessToken('', '', '')
      expect(token).toBe('local-token')
      expect(await checkInbox({token, query, step: 1, timeout: 200})).toMatchObject({
        id: 'message-1',
      })
    } finally {
      reset()
    }

    await expect(getAccessToken('', '', '')).rejects.toThrow('Client ID is missing')
  })

  test('polls missing and empty message lists until mail arrives at the configured Gmail prefix', async () => {
    const email = await checkInbox({
      token: 'local-token',
      query,
      step: 1,
      timeout: 200,
      apiBaseUrl: `${base}/inbox/`,
    })
    expect(email).toMatchObject({id: 'message-1'})
    expect(searches).toBe(3)
  })

  test('rejects authorization failures without logging response bodies', async () => {
    const logged = jest.spyOn(console, 'log').mockImplementation(() => {})

    await expect(
      checkInbox({token: 'invalid', query, step: 1, timeout: 100, apiBaseUrl: `${base}/inbox/`})
    ).rejects.toThrow('Gmail search failed: HTTP 401')

    expect(logged).not.toHaveBeenCalled()
  })
})
