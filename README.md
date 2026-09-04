# gmail-getter

## About package
A simple Node.js client that gets messages from Gmail API via http requests & OAuth. 

Contributions are very welcome!

## Installation
> npm install gmail-getter

## Requirements
To log into Gmail API you need to obtain credentials: Client ID, Client Secret, Refresh token.
These credentails will let you get an Access token, which is required in further requests (like getting list of emails or a single email and etc.).

Steps to go:
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Create **OAuth credentials** in [API & Services](https://console.cloud.google.com/apis/credentials) section (_preferably, select **Desktop** app there if you need it for automated tests_) and then download it.
3. Enable [Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com).
4. Obtain a Refresh token.

To get a Refresh token - simply execute a command in a project root:
> npx gmail-getter get-refresh-token

(or anywhere else if you've got the package installed globally)
> get-refresh-token

You must put `credentials.json` file (p.2) in a place where you execute the command.

⚠️ credentials file name is case-sensitive ⚠️

## Usage
### Import
Import whatever you need from the package:

```
// ES6+
import {getToken, checkInbox} from 'gmail-getter'

// CommonJS
const {getToken, checkInbox} = require('gmail-getter')
```

or the whole package:

```
// ES6+
import gmail from 'gmail-getter'

// CommonJS
const gmail = require('gmail-getter')
```

### Get Access token
You need to get an Access token before you execute other requests:

```
import {getToken} = 'gmail-getter'

const accessToken = await getToken(
  clientId: string,
  clientSecret: string, 
  refreshToken: string
)
```

It'd probably be a good idea to get it on the earlier stages of a test run (global setup?) and store it as an environment variable.

### Check inbox
Use a polling function that returns [an email](https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get#response-body):

```
const email = await checkInbox({
  token: string, 
  timeout: number, 
  step: number, 
  all: boolean, 
  query: string
})
```

* `token` is an access token
* `timeout` sets a maximum execution time for the function
* `step` sets a timeout between retries to fetch an email
* `all` says whether to find a single email or all mathing the query criteria
* `query` lets you filter out emails you want to find, you can find more about queries [there](https://support.google.com/mail/answer/7190)

### Parse HTML from the email
If your email contains html content you can parse it and even render it in the browser with a browser automation tool (like [Playwright](https://playwright.dev/docs/api/class-page#page-set-content)):

```
const html = parseHtml(email)
```

* `email` is an email that you fetch with `checkInbox` function

If you're maintaining an automated test - this might be the best option, as you can verify contents of the email and click any links inside of it.

### Find data in the email
If your email contains html content with a link (like confirmation one) or confirmation code - you can parse it like this:

```
const link = findElementByRegexp(email: Email, regexp: RegExp)
```

* `email` is an email that you fetch with `checkInbox` function
* `regexp` is [a regular expression](https://regex101.com/r/f3RXKp/1) that would recognize a link from the html document

### Whole flow example
And that's how you can get an email you need. It'd probably be good to wrap the logic into a method and then call it from wherever you need (tests?).

```
import {getToken, checkInbox, findElementByRegexp} from 'gmail-getter'

const accessToken = await getToken(
  process.env.CLIENT_ID, 
  process.env.CLIENT_SECRET, 
  process.env.REFRESH_TOKEN
)

const email = await checkInbox({
  token: accessToken,
  query: 'from:squier7 subject:Test!'
})

const regexp = /(https:\/\/)(\S*)(gmail-getter)([\w\/\?\=\-]*)/im
const link = findElementByRegexp(email, regexp)
```
# Envoy fork: emulator endpoints

Existing callers can stay unchanged by configuring an isolated test worker:

```ts
const reset = configureGmail({apiBaseUrl: 'http://127.0.0.1:8026/', accessToken: 'local-test-token'});
try {
  // Existing getAccessToken(...) and checkInbox(...) calls use this configuration.
} finally {
  reset();
}
```

This configuration is process-wide, so do not use it for concurrent consumers
targeting different inboxes in one process. Per-call endpoint options take
precedence. A configured test token skips OAuth; clearing the configuration
restores normal credential validation and Google endpoint defaults.

This fork retains the `@gregjlee/gmail-getter` API and Google endpoint defaults.
For a local Gmail-compatible emulator, supply an API origin or prefix:

```ts
const email = await checkInbox({
  token: 'local-test-token',
  apiBaseUrl: 'https://dashboard.envoy.dev/_hotel2/email/',
  query: 'subject:Invitation',
  timeout: 90000,
  step: 1000,
});
```

`fetchEmailsListByQuery(token, query, {apiBaseUrl})` and
`fetchEmailById(id, token, {apiBaseUrl})` accept the same optional endpoint.
`getAccessToken(clientId, clientSecret, refreshToken, {tokenUrl})` optionally
overrides the OAuth token endpoint. Without these options, requests still go
to Google. Use only local test credentials with emulator endpoints.

Gmail requests use standard Bearer authentication and encode search queries.
Polling continues while message lists are absent or empty. HTTP failures reject
instead of being logged and swallowed; error messages omit response bodies.
The loopback compatibility suite runs with `npm test -- --runInBand tests/emulator.test.ts`.
The original API/helper suites require real Gmail credentials and are separate.
