import axios, {AxiosRequestConfig} from 'axios'
import {Email} from './types'

/**
 * Get an email by its id
 * @param {string} id Unique ID of the email
 * @param {string} token OAuth Access token
 * @returns {Promise<Email>} Email contents
 * @example const email = await fetchEmailById('123456a123b1c1d1', 'ya01.a123456...')
 */
export const fetchEmailById = async (
  id: string,
  token: string,
  options: {apiBaseUrl?: string} = {}
): Promise<Email> => {
  const base = options.apiBaseUrl ?? 'https://gmail.googleapis.com/'
  const config: AxiosRequestConfig = {
    method: 'get',
    url: new URL(
      `gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=full`,
      base.endsWith('/') ? base : base + '/'
    ).href,
    timeout: 15000,
    headers: {Authorization: `Bearer ${token}`},
    validateStatus: () => true,
  }

  const response = await axios.request(config)
  if (response.status >= 400)
    throw new Error(`Gmail message request failed: HTTP ${response.status}`)
  const {data: body} = response

  if (!body) {
    throw new Error('Gmail message response is missing a body')
  }

  return body
}
