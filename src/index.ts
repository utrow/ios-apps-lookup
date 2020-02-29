import * as https from "https"

const APP_STORE_HOSTNAME = 'apps.apple.com'
const APP_TRACK_ID_PREFIX = 'id'
const ITUNES_LOOKUP_API_URL = 'https://itunes.apple.com/lookup'

const args = process.argv
main(args)

function main(args: string[]) {
  if (!validateArgs(args)) {
    process.exit(1)
  }

  const rawUrl = args[2]

  const trackId = getAppTrackId(rawUrl)
  if (!trackId) {
    process.exit(1)
  }
  logInfo(`app.trackId: ${trackId}`)

  fetchItunesLookup(trackId)
    .then(appLookup => {
      logInfo('🎉 Finish')
      console.log(appLookup)
    })
    .catch(e => {
      logError(e)
      process.exit(1)
    })
}

function validateArgs(args: string[]): boolean {
  if (args.length < 2) {
    logError('Argument was not set. Apps URL must be set here.')

    return false
  }

  return true
}

function getAppTrackId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl)

    if (url.hostname !== APP_STORE_HOSTNAME) {
      logError('This URL is not apps url.')
      return null
    }

    const pathNames = url.pathname.split('/')

    const trackId = pathNames[4]
    if (!trackId || !trackId.startsWith(APP_TRACK_ID_PREFIX)) {
      logError('TrackId is not included on url.')
      return null
    }

    return trackId.replace(APP_TRACK_ID_PREFIX, '')

  } catch (e) {
    logError('Missing input URL format.')
    throw e
  }
}

async function fetchItunesLookup(trackId: string): Promise<any> {
  const requestUrl = new URL(ITUNES_LOOKUP_API_URL)
  requestUrl.searchParams.append('id', trackId)

  logInfo(`API Request: ${requestUrl.toString()}`)

  return new Promise<any>((resolve, reject) => {

    https.get(requestUrl, res => {
      if (res.statusCode !== 200) {
        return reject(new Error('Receive error response.'))
      }

      res.on("data", chunk => {
        const appLookup = JSON.parse(chunk.toString())
        return resolve(appLookup)
      })
    }).on("error", e => {
      return reject(e)
    })

  })
}

function logInfo(message: string) {
  console.log(`[Info] ${message}`)
}

function logError(message: string) {
  console.log(`[Error] ${message}`)
}
