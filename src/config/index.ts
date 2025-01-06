import { ConfigError } from '../utils/errors.js'
import { stringToBoolean } from './helpers.js'

// define environment variables via .env file, or via environment variables directly

if (!process.env.PORT || isNaN(Number(process.env.PORT))) {
  throw new ConfigError('Please specify PORT in environment variables.')
}
export const port = +process.env.PORT

// server base url, e.g. to construct correct email verification links
const baseUrl =
  process.env.NODE_ENV === 'vitest' || !process.env.BASE_URL
    ? `http://localhost:${port}`
    : process.env.BASE_URL

export const webId = new URL('/profile/card#bot', baseUrl).toString()

export const isBehindProxy = stringToBoolean(process.env.BEHIND_PROXY)

if (!process.env.GROUP_TO_JOIN)
  throw new ConfigError(
    'Please specify GROUP_TO_JOIN in environment variables.',
  )

export const groupToJoin = process.env.GROUP_TO_JOIN
