import axios, {AxiosRequestConfig} from 'axios'

/**
 * Get Access token from Google API
 * @param {string} clientId OAuth Client ID
 * @param {string} clientSecret OAuth Client Secret
 * @param {string} refreshToken OAuth Refresh token
 * @returns {Promise<string>} Access token
 * @example const accessToken = await getAccessToken('123456-...', 'ABCD-...', '1//ABCD123...')
 */
export const getAccessToken = async (
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  options: {tokenUrl?: string} = {}
): Promise<string> => {
  if (!clientId) throw new Error('Client ID is missing!')
  if (!clientSecret) throw new Error('Client Secret is missing!')
  if (!refreshToken) throw new Error('Refresh Token is missing!')

  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('client_secret', clientSecret)
  params.append('refresh_token', refreshToken)
  params.append('grant_type', 'refresh_token')

  const config: AxiosRequestConfig = {
    method: 'post',
    url: options.tokenUrl ?? 'https://accounts.google.com/o/oauth2/token',
    timeout: 15000,
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    data: params,
    validateStatus: () => true,
  }

  const response = await axios.request(config)
  if (response.status >= 400) throw new Error(`Gmail token request failed: HTTP ${response.status}`)
  const {data: body} = response

  if (!body) {
    throw new Error('Gmail token response is missing a body')
  }

  const {access_token: accessToken} = body

  if (!accessToken) {
    throw new Error('Gmail token response is missing an access token')
  }

  return accessToken
}
