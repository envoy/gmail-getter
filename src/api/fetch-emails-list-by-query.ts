import axios, {AxiosRequestConfig} from 'axios'
import {EmailsList} from './types'
import {Message} from './types/message'

/**
 * Get list of emails
 * @param {string} token OAuth Access token
 * @param {string} [query] Query that specifies search criteria (https://support.google.com/mail/answer/7190)
 * @returns {Promise<Message[]>} List of emails
 * @example const emails = await fetchEmailsListByQuery('ya01.a123456...', 'from:squier7 subject:Test!')
 */
export const fetchEmailsListByQuery = async (
  token: string,
  query?: string,
  options: {apiBaseUrl?: string} = {}
): Promise<Message[]> => {
  if (!token) {
    throw new Error('Access token is missing!')
  }

  const base = options.apiBaseUrl ?? 'https://gmail.googleapis.com/'
  const url = new URL('gmail/v1/users/me/messages', base.endsWith('/') ? base : base + '/')
  if (query) url.searchParams.set('q', query)
  const config: AxiosRequestConfig = {
    method: 'get',
    url: url.href,
    timeout: 15000,
    headers: {Authorization: `Bearer ${token}`},
    validateStatus: () => true,
  }

  const response = await axios.request<EmailsList>(config)
  if (response.status >= 400) throw new Error(`Gmail search failed: HTTP ${response.status}`)
  const {data: body} = response

  if (!body) {
    throw new Error('Gmail search response is missing a body')
  }

  const {messages = []} = body

  if (!Array.isArray(messages)) {
    throw new Error('Gmail search response contains an invalid message list')
  }

  return messages
}
